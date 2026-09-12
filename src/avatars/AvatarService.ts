import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';

import { AiHordeAvatarProvider } from './AiHordeAvatarProvider';
import { DiceBearAvatarProvider } from './DiceBearAvatarProvider';
import { GeneratedPhotosAvatarProvider } from './GeneratedPhotosAvatarProvider';
import { RandomUserAvatarProvider } from './RandomUserAvatarProvider';
import { AvatarProvider, AvatarRequest } from './types';

export type FetchedAvatar = {
  buffer: Buffer;
  provider: string;
};

export class AvatarService {
  private readonly providers: Record<string, AvatarProvider> = {
    generated_photos: new GeneratedPhotosAvatarProvider(),
    ai_horde: new AiHordeAvatarProvider(),
    dicebear: new DiceBearAvatarProvider(),
    randomuser: new RandomUserAvatarProvider(),
  };

  /**
   * Best realistic match first, then progressively weaker sources. Returning
   * null is acceptable: the placard falls back to an initials avatar.
   */
  public async fetchAvatar(request: AvatarRequest): Promise<FetchedAvatar | null> {
    for (const provider of this.getProviderChain()) {
      if (!provider.isConfigured()) {
        continue;
      }

      try {
        const buffer = await provider.fetchAvatar(request);

        if (buffer.length === 0) {
          throw new Error('empty image payload');
        }

        logger.info(
          { provider: provider.name, ethnicity: request.ethnicity },
          'Avatar fetched for opinion placard',
        );

        return { buffer, provider: provider.name };
      } catch (error) {
        logger.warn(
          { error, provider: provider.name },
          'Avatar provider failed; trying the next one',
        );
      }
    }

    return null;
  }

  private getProviderChain(): AvatarProvider[] {
    if (env.AVATAR_PROVIDER !== 'auto') {
      const selected = this.providers[env.AVATAR_PROVIDER];

      // An explicit choice still falls back, so one outage cannot stop the run.
      return [selected, this.providers.randomuser].filter(Boolean);
    }

    return [this.providers.generated_photos, this.providers.ai_horde, this.providers.randomuser];
  }
}
