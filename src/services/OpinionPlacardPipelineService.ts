import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';
import { RenderedOpinionPlacard } from '@/services/OpinionPlacardGenerationService';
import {
  emptyPlatformState,
  OpinionPlacardDoc,
  OpinionPlacardRepository,
} from '@/services/OpinionPlacardRepository';
import { PlacardDedupeService } from '@/services/PlacardDedupeService';
import { PlacardStorageService } from '@/services/PlacardStorageService';
import { PlacardTestOutputService } from '@/services/PlacardTestOutputService';
import { SocialPublishingService } from '@/social/SocialPublishingService';

const MAX_PUBLISH_ATTEMPTS = 3;
const RETRY_BATCH_SIZE = 3;

export class OpinionPlacardPipelineService {
  private readonly storage = new PlacardStorageService();
  private readonly testOutput = new PlacardTestOutputService();
  private readonly dedupeService = new PlacardDedupeService();
  private readonly repository = new OpinionPlacardRepository();
  private readonly publishing = new SocialPublishingService(this.repository);

  public async process(rendered: RenderedOpinionPlacard): Promise<OpinionPlacardDoc | null> {
    // Test runs stay entirely local: no upload, no document, nothing that a
    // later retry could pick up and post.
    if (!env.SOCIAL_PUBLISHING_ENABLED) {
      await this.testOutput.save(rendered);
      await this.cleanupLocalFiles(rendered);

      return null;
    }

    // Claim the content key first: two overlapping runs must not both publish
    // the same take, and losing the race here costs nothing but a skipped slot.
    const reserved = await this.dedupeService.reserveContentKey(
      rendered.questionKey,
      rendered.slug,
    );

    if (!reserved) {
      logger.warn(
        { slug: rendered.slug },
        'Duplicate content key; skipping upload and publish for this placard',
      );
      await this.cleanupLocalFiles(rendered);

      return null;
    }

    const assets = await this.storage.uploadPlacardAssets({
      slug: rendered.slug,
      pngPath: rendered.pngPath,
      videoPath: rendered.videoPath,
      avatarPath: rendered.avatarPath,
    });

    const now = new Date().toISOString();
    const doc: OpinionPlacardDoc = {
      slug: rendered.slug,
      question: rendered.draft.question,
      authorName: rendered.draft.authorName,
      category: rendered.category,
      region: rendered.region,
      countryCode: rendered.countryCode,
      personaLocale: rendered.personaLocale,
      avatarProvider: rendered.avatarProvider,
      trendKey: rendered.trendKey,
      questionKey: rendered.questionKey,
      timestamp: rendered.draft.timestamp,
      verified: rendered.draft.verified,
      agreeVotes: rendered.draft.agreeVotes,
      disagreeVotes: rendered.draft.disagreeVotes,
      trend: rendered.trend ? { ...rendered.trend } : null,
      imageUrl: assets.imageUrl,
      videoUrl: assets.videoUrl,
      avatarUrl: assets.avatarUrl,
      storagePaths: assets.storagePaths,
      status: 'generated',
      platforms: {
        youtube: emptyPlatformState(),
        linkedin: emptyPlatformState(),
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.createPlacard(doc);

    if (rendered.videoPath) {
      const publishedStatus = await this.publishing.publishPlacard(doc, rendered.videoPath);

      if (publishedStatus) {
        doc.status = publishedStatus;
      }
    }

    await this.cleanupLocalFiles(rendered);

    return doc;
  }

  public async retryPendingPublishes(limit: number = RETRY_BATCH_SIZE): Promise<void> {
    const pending = await this.repository.getRetryablePlacards(
      limit,
      MAX_PUBLISH_ATTEMPTS,
      this.publishing.getEnabledPlatforms(),
    );

    if (pending.length === 0) {
      return;
    }

    logger.info({ count: pending.length }, 'Retrying pending social publishes');

    for (const doc of pending) {
      if (!doc.videoUrl) {
        continue;
      }

      let localVideoPath: string | null = null;

      try {
        localVideoPath = await this.downloadVideo(doc);
        await this.publishing.publishPlacard(doc, localVideoPath);
      } catch (error) {
        logger.error({ error, slug: doc.slug }, 'Retrying placard publish failed');
      } finally {
        if (localVideoPath) {
          await fs.promises.rm(localVideoPath, { force: true }).catch(() => undefined);
        }
      }
    }
  }

  private async downloadVideo(doc: OpinionPlacardDoc): Promise<string> {
    const tempDir = path.join(os.tmpdir(), 'scapu-placard-retries');

    await fs.promises.mkdir(tempDir, { recursive: true });

    const localPath = path.join(tempDir, `${doc.slug}.mp4`);
    const response = await axios.get<ArrayBuffer>(doc.videoUrl as string, {
      responseType: 'arraybuffer',
      timeout: 120000,
    });

    await fs.promises.writeFile(localPath, Buffer.from(response.data));

    return localPath;
  }

  private async cleanupLocalFiles(rendered: RenderedOpinionPlacard): Promise<void> {
    const files = [rendered.pngPath, rendered.videoPath, rendered.avatarPath].filter(
      (file): file is string => Boolean(file),
    );

    for (const file of files) {
      await fs.promises.rm(file, { force: true }).catch(() => undefined);
    }

    const backgroundsDir = path.join(process.cwd(), 'public', 'generated-backgrounds');

    try {
      const entries = await fs.promises.readdir(backgroundsDir);

      for (const entry of entries) {
        if (entry.startsWith(`${rendered.slug}-background`)) {
          await fs.promises.rm(path.join(backgroundsDir, entry), { force: true });
        }
      }
    } catch {
      // Backgrounds directory may not exist when no background video was used.
    }

    logger.info({ slug: rendered.slug }, 'Local placard files cleaned up after Firebase upload');
  }
}
