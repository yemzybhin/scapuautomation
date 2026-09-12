import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';
import {
  OpinionPlacardDoc,
  OpinionPlacardRepository,
  PlacardPlatform,
  PlacardStatus,
  PlatformPostState,
} from '@/services/OpinionPlacardRepository';

import { LinkedInPublisher } from './LinkedInPublisher';
import { PublisherPermissionError, SocialPublisher } from './types';
import { YouTubePublisher } from './YouTubePublisher';

export class SocialPublishingService {
  private readonly publishers: SocialPublisher[] = [
    new YouTubePublisher(),
    // new LinkedInPublisher(),
  ];

  constructor(private readonly repository: OpinionPlacardRepository) {}

  public async publishPlacard(
    doc: OpinionPlacardDoc,
    videoPath: string,
  ): Promise<PlacardStatus | null> {
    if (!env.SOCIAL_PUBLISHING_ENABLED) {
      logger.info({ slug: doc.slug }, 'Social publishing is disabled; skipping');
      return null;
    }

    const configuredPublishers = this.publishers.filter(publisher => publisher.isConfigured());
    const skippedPlatforms = this.publishers
      .filter(publisher => !publisher.isConfigured())
      .map(publisher => publisher.platform);

    if (skippedPlatforms.length > 0) {
      logger.warn({ slug: doc.slug, skippedPlatforms }, 'Some platforms are missing credentials');
    }

    if (configuredPublishers.length === 0) {
      return null;
    }

    const platformStates: Record<string, PlatformPostState> = { ...doc.platforms };

    for (const publisher of configuredPublishers) {
      if (platformStates[publisher.platform]?.posted) {
        continue;
      }

      try {
        const result = await publisher.publish({
          videoPath,
          title: this.buildTitle(doc),
          description: this.buildDescription(doc),
        });
        const postedState: Partial<PlatformPostState> = {
          posted: true,
          postedAt: new Date().toISOString(),
          url: result.url,
          externalId: result.externalId,
          error: null,
        };

        platformStates[publisher.platform] = {
          ...platformStates[publisher.platform],
          ...postedState,
        } as PlatformPostState;

        await this.repository.updatePlatformResult(doc.slug, publisher.platform, postedState);

        logger.info(
          { slug: doc.slug, platform: publisher.platform, url: result.url },
          'Placard posted',
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isPermissionError = error instanceof PublisherPermissionError;

        platformStates[publisher.platform] = {
          ...platformStates[publisher.platform],
          posted: false,
          error: message,
        } as PlatformPostState;

        await this.repository.updatePlatformResult(
          doc.slug,
          publisher.platform,
          { posted: false, error: message },
          !isPermissionError,
        );

        logger.error(
          { reason: message, slug: doc.slug, platform: publisher.platform },
          'Placard post failed',
        );
      }
    }

    const status = this.computeStatus(platformStates);

    await this.repository.updateStatus(doc.slug, status);

    return status;
  }

  /** Platforms with a publisher wired up. Disabled ones must not hold a placard open. */
  public getEnabledPlatforms(): PlacardPlatform[] {
    return this.publishers.map(publisher => publisher.platform);
  }

  private computeStatus(platformStates: Record<string, PlatformPostState>): PlacardStatus {
    const platforms = this.getEnabledPlatforms();
    const postedCount = platforms.filter(platform => platformStates[platform]?.posted).length;

    if (postedCount === platforms.length) {
      return 'posted';
    }

    return postedCount > 0 ? 'partially_posted' : 'failed';
  }

  private buildTitle(doc: OpinionPlacardDoc): string {
    return doc.question;
  }

  private buildDescription(doc: OpinionPlacardDoc): string {
    const categoryTag = doc.category.replace(/[^a-zA-Z0-9]/g, '');

    return `${doc.question}\n\nWhat do you think? Agree or disagree?\n\n#Scapu #${categoryTag} #Shorts`;
  }
}
