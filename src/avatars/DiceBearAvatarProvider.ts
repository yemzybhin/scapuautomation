import axios from 'axios';

import { AvatarProvider, AvatarRequest } from './types';

/** Skin tones roughly matching each region, since DiceBear art is illustrated. */
const SKIN_COLORS: Record<AvatarRequest['ethnicity'], string[]> = {
  african: ['614335', '8d5524'],
  european: ['edb98a', 'ffdbb4'],
  latino: ['d08b5b', 'ae5d29'],
  asian: ['f8d25c', 'edb98a'],
};

/** Free and key-less, but illustrated rather than photographic. */
export class DiceBearAvatarProvider implements AvatarProvider {
  public readonly name = 'dicebear';

  public isConfigured(): boolean {
    return true;
  }

  public async fetchAvatar(request: AvatarRequest): Promise<Buffer> {
    const palette = SKIN_COLORS[request.ethnicity];
    const skinColor = palette[Math.abs(request.seed) % palette.length];
    const response = await axios.get<ArrayBuffer>('https://api.dicebear.com/9.x/personas/png', {
      responseType: 'arraybuffer',
      timeout: 15000,
      params: { seed: `scapu-${request.seed}`, skinColor, size: 256 },
    });

    return Buffer.from(response.data);
  }
}
