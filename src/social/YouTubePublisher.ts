import axios from 'axios';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';

import { PublishInput, PublishResult, SocialPublisher } from './types';

export class YouTubePublisher implements SocialPublisher {
  public readonly platform = 'youtube' as const;

  public isConfigured(): boolean {
    return Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN);
  }

  public async publish(input: PublishInput): Promise<PublishResult> {
    const accessToken = await this.getAccessToken();
    const fileSize = (await fs.promises.stat(input.videoPath)).size;

    const metadata = {
      snippet: {
        title: this.sanitizeTitle(input.title),
        description: input.description,
        categoryId: env.YOUTUBE_CATEGORY_ID,
        tags: ['Scapu', 'Shorts', 'Opinion'],
      },
      status: {
        privacyStatus: env.YOUTUBE_PRIVACY_STATUS,
        selfDeclaredMadeForKids: false,
      },
    };

    const initResponse = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': String(fileSize),
          'X-Upload-Content-Type': 'video/mp4',
        },
      },
    );

    const uploadUrl = initResponse.headers.location as string | undefined;

    if (!uploadUrl) {
      throw new Error('YouTube did not return a resumable upload URL');
    }

    const uploadResponse = await axios.put(uploadUrl, fs.createReadStream(input.videoPath), {
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': 'video/mp4',
      },
      maxBodyLength: Infinity,
    });

    const videoId = uploadResponse.data?.id as string | undefined;

    if (!videoId) {
      throw new Error('YouTube upload did not return a video id');
    }

    const grantedPrivacy = uploadResponse.data?.status?.privacyStatus as string | undefined;

    logger.info(
      { videoId, requestedPrivacy: env.YOUTUBE_PRIVACY_STATUS, grantedPrivacy },
      'YouTube video uploaded',
    );

    // An unaudited API project has its uploads forced to private regardless of what we ask for.
    if (grantedPrivacy && grantedPrivacy !== env.YOUTUBE_PRIVACY_STATUS) {
      logger.warn(
        { videoId, requestedPrivacy: env.YOUTUBE_PRIVACY_STATUS, grantedPrivacy },
        'YouTube downgraded the requested privacy status; the API project likely needs a compliance audit',
      );
    }

    return {
      externalId: videoId,
      url: `https://www.youtube.com/shorts/${videoId}`,
    };
  }

  private async getAccessToken(): Promise<string> {
    const client = new OAuth2Client(env.YOUTUBE_CLIENT_ID, env.YOUTUBE_CLIENT_SECRET);

    client.setCredentials({ refresh_token: env.YOUTUBE_REFRESH_TOKEN });

    const { token } = await client.getAccessToken();

    if (!token) {
      throw new Error('Could not obtain a YouTube access token from the refresh token');
    }

    return token;
  }

  private sanitizeTitle(title: string): string {
    const cleaned = title.replace(/[<>]/g, '').trim();

    return cleaned.length > 100 ? `${cleaned.slice(0, 97)}...` : cleaned;
  }
}
