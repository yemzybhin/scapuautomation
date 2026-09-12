import axios from 'axios';

import { AvatarProvider, AvatarRequest } from './types';

/** Original source. Kept as a last resort: its faces cannot be filtered by ethnicity. */
export class RandomUserAvatarProvider implements AvatarProvider {
  public readonly name = 'randomuser';

  public isConfigured(): boolean {
    return true;
  }

  public async fetchAvatar(request: AvatarRequest): Promise<Buffer> {
    const gender = request.seed % 2 === 0 ? 'women' : 'men';
    const portraitId = ((Math.abs(request.seed) * 37) % 99) + 1;
    const response = await axios.get<ArrayBuffer>(
      `https://randomuser.me/api/portraits/${gender}/${portraitId}.jpg`,
      {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScapuOpinionPlacardBot/1.0; +https://scapu.app)',
        },
      },
    );

    return Buffer.from(response.data);
  }
}
