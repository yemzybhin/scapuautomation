import { randomUUID } from 'crypto';
import fs from 'fs';

import { getPlacardBucket } from '@/config/firebase';
import { logger } from '@/middleware/pino-logger';

export type UploadedPlacardAssets = {
  imageUrl: string;
  videoUrl: string | null;
  avatarUrl: string | null;
  storagePaths: {
    image: string;
    video: string | null;
    avatar: string | null;
  };
};

type UploadPlacardAssetsInput = {
  slug: string;
  pngPath: string;
  videoPath: string | null;
  avatarPath: string | null;
};

export class PlacardStorageService {
  public async uploadPlacardAssets(
    input: UploadPlacardAssetsInput,
  ): Promise<UploadedPlacardAssets> {
    const date = new Date().toISOString().slice(0, 10);
    const basePath = `opinion-placards/${date}/${input.slug}`;

    const image = await this.uploadFile(input.pngPath, `${basePath}/placard.png`, 'image/png');
    const video = input.videoPath
      ? await this.uploadFile(input.videoPath, `${basePath}/video.mp4`, 'video/mp4')
      : null;
    const avatar = input.avatarPath
      ? await this.uploadFile(input.avatarPath, `${basePath}/avatar.png`, 'image/png')
      : null;

    logger.info(
      { slug: input.slug, imageUrl: image.url, videoUrl: video?.url ?? null },
      'Opinion placard assets uploaded to Firebase Storage',
    );

    return {
      imageUrl: image.url,
      videoUrl: video?.url ?? null,
      avatarUrl: avatar?.url ?? null,
      storagePaths: {
        image: image.path,
        video: video?.path ?? null,
        avatar: avatar?.path ?? null,
      },
    };
  }

  private async uploadFile(
    localPath: string,
    destination: string,
    contentType: string,
  ): Promise<{ url: string; path: string }> {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Cannot upload missing file: ${localPath}`);
    }

    const bucket = getPlacardBucket();
    const downloadToken = randomUUID();

    await bucket.upload(localPath, {
      destination,
      contentType,
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;

    return { url, path: destination };
  }
}
