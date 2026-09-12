import axios from 'axios';

import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';

import { AvatarProvider, AvatarRequest } from './types';

const HORDE_API = 'https://stablehorde.net/api/v2';
const POLL_INTERVAL_MS = 5000;
const GENERATION_TIMEOUT_MS = 180000;

const ETHNICITY_PROMPTS: Record<AvatarRequest['ethnicity'], string> = {
  african: 'a Black African person',
  european: 'a white European person',
  latino: 'a Latino person',
  asian: 'an Asian person',
};

/**
 * Free community-run Stable Diffusion. No billing and no signup required (the
 * anonymous key works), but jobs queue, so it is used as a fallback rather than
 * the primary source.
 */
export class AiHordeAvatarProvider implements AvatarProvider {
  public readonly name = 'ai_horde';

  public isConfigured(): boolean {
    return Boolean(env.AI_HORDE_API_KEY);
  }

  public async fetchAvatar(request: AvatarRequest): Promise<Buffer> {
    const id = await this.submitJob(request);
    const imageUrl = await this.waitForImage(id);
    const image = await axios.get<ArrayBuffer>(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return Buffer.from(image.data);
  }

  private async submitJob(request: AvatarRequest): Promise<string> {
    const subject = ETHNICITY_PROMPTS[request.ethnicity];
    const prompt = `close up profile photo of ${subject}, ${request.photoDescriptor}, candid smartphone selfie, natural daylight, plain background, sharp focus, photorealistic ### cartoon, illustration, painting, deformed, watermark, text, multiple people`;

    const response = await axios.post(
      `${HORDE_API}/generate/async`,
      {
        prompt,
        params: {
          sampler_name: 'k_euler_a',
          width: 512,
          height: 512,
          steps: 20,
          cfg_scale: 7,
          n: 1,
        },
        nsfw: false,
        censor_nsfw: true,
        models: ['stable_diffusion'],
      },
      {
        timeout: 30000,
        headers: { apikey: env.AI_HORDE_API_KEY, 'Content-Type': 'application/json' },
      },
    );

    const id = response.data?.id as string | undefined;

    if (!id) {
      throw new Error('AI Horde did not return a job id');
    }

    return id;
  }

  private async waitForImage(id: string): Promise<string> {
    const deadline = Date.now() + GENERATION_TIMEOUT_MS;

    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

      const check = await axios.get(`${HORDE_API}/generate/check/${id}`, { timeout: 20000 });

      if (!check.data?.done) {
        continue;
      }

      const status = await axios.get(`${HORDE_API}/generate/status/${id}`, { timeout: 30000 });
      const imageUrl = status.data?.generations?.[0]?.img as string | undefined;

      if (!imageUrl) {
        throw new Error('AI Horde finished without returning an image');
      }

      return imageUrl;
    }

    logger.warn({ id }, 'AI Horde avatar generation timed out');
    throw new Error('AI Horde avatar generation timed out');
  }
}
