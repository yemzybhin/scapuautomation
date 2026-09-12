import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';

type PexelsVideoFile = {
  id: number;
  quality: string | null;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
};

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  video_files: PexelsVideoFile[];
};

type PexelsSearchResponse = {
  videos?: PexelsVideo[];
};

type PexelsPhoto = {
  id: number;
  src: { original: string; portrait: string; large: string };
};

type PexelsPhotoSearchResponse = {
  photos?: PexelsPhoto[];
};

const TARGET_WIDTH = 720;
const TARGET_HEIGHT = 1280;
/** Keep the cache small; clips are tens of megabytes each. */
const MAX_CACHED_CLIPS = 24;

export class PexelsBackgroundService {
  private readonly endpoint = 'https://api.pexels.com/videos/search';
  private readonly photoEndpoint = 'https://api.pexels.com/v1/search';
  private readonly cacheDir = path.join(os.tmpdir(), 'scapu-pexels-backgrounds');

  public isConfigured(): boolean {
    return Boolean(env.PEXELS_API_KEY);
  }

  /**
   * Returns a local path to portrait stock footage for the query, or null so the
   * caller can fall back to the generated animated background.
   *
   * Results are cached on disk by query and variant: the cron runs often, and a
   * fresh multi-megabyte download per placard would waste bandwidth and burn the
   * hourly rate limit for no visual benefit.
   */
  public async getBackgroundVideo(
    query: string,
    minDurationSeconds: number,
    seed: number,
  ): Promise<string | null> {
    if (!this.isConfigured() || !query.trim()) {
      return null;
    }

    try {
      const videos = await this.search(query, minDurationSeconds);

      if (videos.length === 0) {
        logger.warn({ query }, 'Pexels returned no usable portrait footage');
        return null;
      }

      const video = videos[Math.abs(seed) % videos.length];
      const file = this.pickClosestVariant(video);

      if (!file) {
        return null;
      }

      return await this.downloadWithCache(file, video.id);
    } catch (error) {
      logger.warn({ error, query }, 'Pexels background lookup failed');
      return null;
    }
  }

  /**
   * Stock photo for the query. Rendering a still is far cheaper than decoding
   * video frames, so this is the default background source.
   */
  public async getBackgroundImage(query: string, seed: number): Promise<string | null> {
    if (!this.isConfigured() || !query.trim()) {
      return null;
    }

    try {
      const response = await axios.get<PexelsPhotoSearchResponse>(this.photoEndpoint, {
        timeout: 20000,
        headers: { Authorization: env.PEXELS_API_KEY as string },
        params: { query, orientation: 'portrait', per_page: 15 },
      });

      const photos = response.data.photos ?? [];

      if (photos.length === 0) {
        logger.warn({ query }, 'Pexels returned no portrait photos');
        return null;
      }

      const photo = photos[Math.abs(seed) % photos.length];
      // Request a crop slightly larger than the canvas so the slow zoom stays sharp.
      const url = photo.src.original + '?auto=compress&cs=tinysrgb&fit=crop&w=1080&h=1920';

      return await this.downloadImageWithCache(url, photo.id);
    } catch (error) {
      logger.warn({ error, query }, 'Pexels image lookup failed');
      return null;
    }
  }

  private async downloadImageWithCache(url: string, photoId: number): Promise<string> {
    await fs.promises.mkdir(this.cacheDir, { recursive: true });

    const key = crypto.createHash('sha1').update(String(photoId)).digest('hex').slice(0, 16);
    const cachedPath = path.join(this.cacheDir, key + '.jpg');

    if (fs.existsSync(cachedPath) && (await fs.promises.stat(cachedPath)).size > 0) {
      logger.info({ cachedPath }, 'Reusing cached Pexels background image');
      return cachedPath;
    }

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    await fs.promises.writeFile(cachedPath, Buffer.from(response.data));
    await this.pruneCache();

    logger.info({ cachedPath }, 'Downloaded Pexels background image');

    return cachedPath;
  }

  private async search(query: string, minDurationSeconds: number): Promise<PexelsVideo[]> {
    const response = await axios.get<PexelsSearchResponse>(this.endpoint, {
      timeout: 20000,
      headers: { Authorization: env.PEXELS_API_KEY as string },
      params: {
        query,
        orientation: 'portrait',
        per_page: 15,
        min_duration: Math.ceil(minDurationSeconds),
      },
    });

    return (response.data.videos ?? []).filter(video =>
      video.video_files.some(file => (file.height ?? 0) >= 720),
    );
  }

  /** Prefers the variant nearest 720x1280 so a 4K file is never pulled for a 720p render. */
  private pickClosestVariant(video: PexelsVideo): PexelsVideoFile | null {
    const candidates = video.video_files.filter(
      file => file.file_type === 'video/mp4' && (file.height ?? 0) >= 720,
    );

    if (candidates.length === 0) {
      return null;
    }

    return candidates.sort((left, right) => this.variantCost(left) - this.variantCost(right))[0];
  }

  private variantCost(file: PexelsVideoFile): number {
    return (
      Math.abs((file.width ?? 0) - TARGET_WIDTH) + Math.abs((file.height ?? 0) - TARGET_HEIGHT)
    );
  }

  private async downloadWithCache(file: PexelsVideoFile, videoId: number): Promise<string> {
    await fs.promises.mkdir(this.cacheDir, { recursive: true });

    const key = crypto.createHash('sha1').update(`${videoId}-${file.id}`).digest('hex').slice(0, 16);
    const cachedPath = path.join(this.cacheDir, `${key}.mp4`);

    if (fs.existsSync(cachedPath) && (await fs.promises.stat(cachedPath)).size > 0) {
      logger.info({ cachedPath }, 'Reusing cached Pexels background');
      return cachedPath;
    }

    const response = await axios.get<ArrayBuffer>(file.link, {
      responseType: 'arraybuffer',
      timeout: 120000,
    });

    await fs.promises.writeFile(cachedPath, Buffer.from(response.data));
    await this.pruneCache();

    logger.info(
      { cachedPath, size: `${file.width}x${file.height}` },
      'Downloaded Pexels background clip',
    );

    return cachedPath;
  }

  private async pruneCache(): Promise<void> {
    try {
      const entries = await fs.promises.readdir(this.cacheDir);

      if (entries.length <= MAX_CACHED_CLIPS) {
        return;
      }

      const withTimes = await Promise.all(
        entries.map(async name => {
          const full = path.join(this.cacheDir, name);
          return { full, mtime: (await fs.promises.stat(full)).mtimeMs };
        }),
      );

      const oldestFirst = withTimes.sort((left, right) => left.mtime - right.mtime);

      for (const entry of oldestFirst.slice(0, entries.length - MAX_CACHED_CLIPS)) {
        await fs.promises.rm(entry.full, { force: true });
      }
    } catch {
      // A full cache is a minor issue; never fail a render over it.
    }
  }
}
