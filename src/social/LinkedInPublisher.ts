import axios from 'axios';
import fs from 'fs';

import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';

import { PublisherPermissionError, PublishInput, PublishResult, SocialPublisher } from './types';

type UploadInstruction = {
  uploadUrl: string;
  firstByte: number;
  lastByte: number;
};

type InitializeUploadResponse = {
  value: {
    video: string;
    uploadToken?: string;
    uploadInstructions: UploadInstruction[];
  };
};

const LINKEDIN_API = 'https://api.linkedin.com';
const LINKEDIN_VERSION = '202606';
const PROCESSING_POLL_INTERVAL_MS = 10000;
const PROCESSING_TIMEOUT_MS = 180000;

export class LinkedInPublisher implements SocialPublisher {
  public readonly platform = 'linkedin' as const;

  public isConfigured(): boolean {
    return Boolean(env.LINKEDIN_ACCESS_TOKEN && this.getAuthorUrn());
  }

  private getAuthorUrn(): string | undefined {
    return env.LINKEDIN_ORG_URN || env.LINKEDIN_PERSON_URN;
  }

  public async publish(input: PublishInput): Promise<PublishResult> {
    const videoUrn = await this.uploadVideo(input.videoPath).catch(error => {
      throw this.translateError(error);
    });

    await this.waitForProcessing(videoUrn);

    const postUrn = await this.createPost(videoUrn, input).catch(error => {
      throw this.translateError(error);
    });

    logger.info({ postUrn, videoUrn }, 'LinkedIn video post published');

    return {
      externalId: postUrn,
      url: `https://www.linkedin.com/feed/update/${postUrn}`,
    };
  }

  private async uploadVideo(videoPath: string): Promise<string> {
    const fileSizeBytes = (await fs.promises.stat(videoPath)).size;

    const initResponse = await axios.post<InitializeUploadResponse>(
      `${LINKEDIN_API}/rest/videos?action=initializeUpload`,
      {
        initializeUploadRequest: {
          owner: this.getAuthorUrn(),
          fileSizeBytes,
          uploadCaptions: false,
          uploadThumbnail: false,
        },
      },
      { headers: this.headers() },
    );

    const { video: videoUrn, uploadToken, uploadInstructions } = initResponse.data.value;
    const fileBuffer = await fs.promises.readFile(videoPath);
    const uploadedPartIds: string[] = [];

    for (const instruction of uploadInstructions) {
      const chunk = fileBuffer.subarray(instruction.firstByte, instruction.lastByte + 1);
      const uploadResponse = await axios.put(instruction.uploadUrl, chunk, {
        headers: {
          Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
      });

      const etag = uploadResponse.headers.etag as string | undefined;

      if (!etag) {
        throw new Error('LinkedIn video part upload did not return an ETag');
      }

      uploadedPartIds.push(etag);
    }

    await axios.post(
      `${LINKEDIN_API}/rest/videos?action=finalizeUpload`,
      {
        finalizeUploadRequest: {
          video: videoUrn,
          uploadToken: uploadToken ?? '',
          uploadedPartIds,
        },
      },
      { headers: this.headers() },
    );

    return videoUrn;
  }

  private async waitForProcessing(videoUrn: string): Promise<void> {
    const deadline = Date.now() + PROCESSING_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const response = await axios.get(
        `${LINKEDIN_API}/rest/videos/${encodeURIComponent(videoUrn)}`,
        { headers: this.headers() },
      );
      const status = response.data?.status as string | undefined;

      if (status === 'AVAILABLE') {
        return;
      }

      if (status === 'PROCESSING_FAILED') {
        throw new Error('LinkedIn video processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, PROCESSING_POLL_INTERVAL_MS));
    }

    throw new Error('Timed out waiting for LinkedIn video processing');
  }

  private async createPost(videoUrn: string, input: PublishInput): Promise<string> {
    const response = await axios.post(
      `${LINKEDIN_API}/rest/posts`,
      {
        author: this.getAuthorUrn(),
        commentary: this.escapeCommentary(input.description),
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            id: videoUrn,
            title: input.title,
          },
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      },
      { headers: this.headers() },
    );

    const postUrn = response.headers['x-restli-id'] as string | undefined;

    if (!postUrn) {
      throw new Error('LinkedIn post creation did not return a post URN');
    }

    return postUrn;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    };
  }

  /**
   * LinkedIn reports a missing organization scope as a 400 with a permissions message,
   * and an expired or unscoped token as 401/403. Both mean the credentials need work
   * rather than the video, so they should not burn a publish attempt.
   */
  private translateError(error: unknown): Error {
    if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error : new Error(String(error));
    }

    const status = error.response?.status;
    const message = String(error.response?.data?.message ?? error.message);

    if (status === 401 || status === 403 || /permission/i.test(message)) {
      return new PublisherPermissionError(`LinkedIn credentials lack permission: ${message}`);
    }

    return new Error(`LinkedIn API error ${status ?? ''}: ${message}`.trim());
  }

  private escapeCommentary(value: string): string {
    return value.replace(/[\\|{}@[\]()<>#*_~]/g, match => `\\${match}`);
  }
}
