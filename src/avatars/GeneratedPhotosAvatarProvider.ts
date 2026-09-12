import axios from 'axios';

import { env } from '@/config/env-config';

import { AvatarProvider, AvatarRequest } from './types';

type GeneratedPhotosResponse = {
  faces?: { urls?: Record<string, string>[] }[];
};

/**
 * generated.photos serves synthetic faces and is the only source here with a
 * real ethnicity filter, so it is the primary provider when a key is present.
 */
export class GeneratedPhotosAvatarProvider implements AvatarProvider {
  public readonly name = 'generated_photos';
  private readonly endpoint = 'https://api.generated.photos/api/v1/faces';

  public isConfigured(): boolean {
    return Boolean(env.GENERATED_PHOTOS_API_KEY);
  }

  public async fetchAvatar(request: AvatarRequest): Promise<Buffer> {
    const perPage = 20;
    const response = await axios.get<GeneratedPhotosResponse>(this.endpoint, {
      timeout: 20000,
      params: {
        ethnicity: request.ethnicity,
        age: 'young-adult',
        order_by: 'random',
        per_page: perPage,
      },
      headers: { Authorization: `API-Key ${env.GENERATED_PHOTOS_API_KEY}` },
    });

    const faces = response.data.faces ?? [];

    if (faces.length === 0) {
      throw new Error('generated.photos returned no faces');
    }

    const face = faces[Math.abs(request.seed) % faces.length];
    const imageUrl = this.pickLargestUrl(face);

    if (!imageUrl) {
      throw new Error('generated.photos face had no usable image url');
    }

    const image = await axios.get<ArrayBuffer>(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
    });

    return Buffer.from(image.data);
  }

  private pickLargestUrl(face: { urls?: Record<string, string>[] }): string | null {
    for (const entry of face.urls ?? []) {
      const url = Object.values(entry)[0];

      if (url) {
        return url;
      }
    }

    return null;
  }
}
