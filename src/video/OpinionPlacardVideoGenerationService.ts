import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'fs';
import path from 'path';

import {
  OPINION_PLACARD_CATEGORY_ACCENT_COLORS,
  OPINION_PLACARD_CATEGORY_COLORS,
  OpinionPlacardCategory,
} from '@/constants/opinionPlacard';
import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';
import { PexelsBackgroundService } from '@/services/PexelsBackgroundService';

import { OpinionPlacardVideoProps, VideoTemplate } from './types';

export type OpinionPlacardVideoInput = {
  authorName: string;
  question: string;
  category: OpinionPlacardCategory;
  timestamp: string;
  verified: boolean;
  agreeVotes: number;
  disagreeVotes: number;
  avatarPath: string | null;
  outputDir: string;
  slug: string;
  runCount: number;
  backgroundVideoQuery?: string;
};

export class OpinionPlacardVideoGenerationService {
  private readonly pexelsService = new PexelsBackgroundService();

  private readonly durationInFrames = 330;
  private readonly fps = 30;
  private readonly width = 720;
  private readonly height = 1280;

  public async generateVideo(input: OpinionPlacardVideoInput): Promise<string | null> {
    try {
      const outputPath = path.join(input.outputDir, `${input.slug}.mp4`);
      // The background clip must land in public/ before bundling: the bundler
      // snapshots that folder, so anything copied afterwards 404s at render time.
      const background = await this.prepareBackground(
        input.slug,
        input.runCount,
        input.backgroundVideoQuery,
      );
      const bundleLocation = await bundle({
        entryPoint: path.resolve(process.cwd(), 'src/video/index.tsx'),
      });
      const avatarDataUrl = await this.readAvatarDataUrl(input.avatarPath);
      const inputProps: OpinionPlacardVideoProps = {
        authorName: input.authorName,
        question: input.question,
        category: input.category,
        categoryColor: OPINION_PLACARD_CATEGORY_COLORS[input.category],
        categoryAccentColor: OPINION_PLACARD_CATEGORY_ACCENT_COLORS[input.category],
        timestamp: input.timestamp,
        verified: input.verified,
        agreeVotes: input.agreeVotes,
        disagreeVotes: input.disagreeVotes,
        avatarDataUrl,
        backgroundVideoSrc: background.videoSrc,
        backgroundImageSrc: background.imageSrc,
        soundtrackSrc: this.pickSoundtrack(input.runCount),
        soundtrackVolume: env.SOUNDTRACK_VOLUME,
      };
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: VideoTemplate.OPINION_PLACARD,
        inputProps,
      });

      await renderMedia({
        composition: {
          ...composition,
          durationInFrames: this.durationInFrames,
          fps: this.fps,
          width: this.width,
          height: this.height,
        },
        serveUrl: bundleLocation,
        codec: 'h264',
        imageFormat: 'jpeg',
        crf: 22,
        pixelFormat: 'yuv420p',
        x264Preset: 'medium',
        concurrency: 4,
        outputLocation: outputPath,
        inputProps,
      });

      return outputPath;
    } catch (error) {
      logger.error({ error }, 'Opinion placard video generation failed');
      return null;
    }
  }

  public async generateStillImage(input: OpinionPlacardVideoInput): Promise<string | null> {
    try {
      const outputPath = path.join(input.outputDir, `${input.slug}.png`);
      const bundleLocation = await bundle({
        entryPoint: path.resolve(process.cwd(), 'src/video/index.tsx'),
      });
      const avatarDataUrl = await this.readAvatarDataUrl(input.avatarPath);
      const inputProps: OpinionPlacardVideoProps = {
        authorName: input.authorName,
        question: input.question,
        category: input.category,
        categoryColor: OPINION_PLACARD_CATEGORY_COLORS[input.category],
        categoryAccentColor: OPINION_PLACARD_CATEGORY_ACCENT_COLORS[input.category],
        timestamp: input.timestamp,
        verified: input.verified,
        agreeVotes: input.agreeVotes,
        disagreeVotes: input.disagreeVotes,
        avatarDataUrl,
        backgroundVideoSrc: null,
        staticCardOnly: true,
      };
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: VideoTemplate.OPINION_PLACARD,
        inputProps,
      });

      await renderStill({
        composition: {
          ...composition,
          width: 720,
          height: this.getStaticCardHeight(input.question),
        },
        serveUrl: bundleLocation,
        output: outputPath,
        inputProps,
      });

      return outputPath;
    } catch (error) {
      logger.error({ error }, 'Opinion placard still generation failed');
      return null;
    }
  }

  private async readAvatarDataUrl(avatarPath: string | null): Promise<string | null> {
    if (!avatarPath) {
      return null;
    }

    try {
      const buffer = await fs.promises.readFile(avatarPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
      logger.warn({ error, avatarPath }, 'Could not read avatar for opinion placard video');
      return null;
    }
  }

  private async prepareBackground(
    slug: string,
    runCount: number,
    backgroundQuery?: string,
  ): Promise<{ videoSrc: string | null; imageSrc: string | null }> {
    if (env.BACKGROUND_MODE === 'none') {
      return { videoSrc: null, imageSrc: null };
    }

    if (env.BACKGROUND_MODE === 'image') {
      const imagePath = await this.pexelsService.getBackgroundImage(
        backgroundQuery ?? '',
        runCount,
      );

      if (!imagePath) {
        logger.warn('No stock image available; using generated animated background');
        return { videoSrc: null, imageSrc: null };
      }

      const imageSrc = await this.copyIntoPublic(imagePath, slug + '-background');

      return { videoSrc: null, imageSrc };
    }

    return { videoSrc: await this.prepareBackgroundVideo(slug, runCount, backgroundQuery), imageSrc: null };
  }

  /**
   * Rotates through whatever sits in public/audio, so licensed tracks can be
   * dropped in beside the generated beds without any code change.
   */
  private pickSoundtrack(runCount: number): string | null {
    if (!env.SOUNDTRACK_ENABLED) {
      return null;
    }

    const audioDir = path.join(process.cwd(), 'public', 'audio');

    if (!fs.existsSync(audioDir)) {
      return null;
    }

    const tracks = fs
      .readdirSync(audioDir)
      .filter(name => ['.wav', '.mp3', '.m4a', '.aac'].includes(path.extname(name).toLowerCase()))
      .sort();

    if (tracks.length === 0) {
      logger.warn('Soundtrack enabled but public/audio is empty');
      return null;
    }

    const track = tracks[Math.abs(runCount) % tracks.length];

    logger.info({ track }, 'Selected placard soundtrack');

    return 'audio/' + track;
  }

  /** Remotion serves assets from public/, so the chosen file is copied in before bundling. */
  private async copyIntoPublic(sourcePath: string, baseName: string): Promise<string> {
    const generatedDir = path.join(process.cwd(), 'public', 'generated-backgrounds');
    await fs.promises.mkdir(generatedDir, { recursive: true });

    const extension = path.extname(sourcePath) || '.jpg';
    const publicFileName = baseName + extension;

    await fs.promises.copyFile(sourcePath, path.join(generatedDir, publicFileName));

    return 'generated-backgrounds/' + publicFileName;
  }

  private async prepareBackgroundVideo(
    slug: string,
    runCount: number,
    backgroundVideoQuery?: string,
  ): Promise<string | null> {
    // Stock footage first, then any locally provided clips, then the generated
    // animated background.
    const stockPath = await this.pexelsService.getBackgroundVideo(
      backgroundVideoQuery ?? '',
      this.durationInFrames / this.fps + 1,
      runCount,
    );
    const backgroundPath = stockPath ?? (await this.findBackgroundVideo(runCount));

    if (!backgroundPath) {
      logger.warn('No opinion placard background video found; using generated animated background');
      return null;
    }

    const generatedDir = path.join(process.cwd(), 'public', 'generated-backgrounds');
    await fs.promises.mkdir(generatedDir, { recursive: true });

    const extension = path.extname(backgroundPath) || '.mp4';
    const publicFileName = `${slug}-background${extension}`;
    const publicPath = path.join(generatedDir, publicFileName);

    await fs.promises.copyFile(backgroundPath, publicPath);

    return `generated-backgrounds/${publicFileName}`;
  }

  private getStaticCardHeight(question: string): number {
    return 768 + this.estimateLineCount(question, 720 - 56 * 2, 35) * 44;
  }

  private estimateLineCount(value: string, maxWidth: number, fontSize: number): number {
    const words = value.split(/\s+/).filter(Boolean);
    const averageCharWidth = fontSize * 0.56;
    const maxChars = Math.max(12, Math.floor(maxWidth / averageCharWidth));
    let lineLength = 0;
    let lineCount = 1;

    for (const word of words) {
      const nextLength = lineLength === 0 ? word.length : lineLength + 1 + word.length;

      if (nextLength > maxChars && lineLength > 0) {
        lineCount += 1;
        lineLength = word.length;
      } else {
        lineLength = nextLength;
      }
    }

    return Math.min(6, Math.max(1, lineCount));
  }

  private async findBackgroundVideo(runCount: number): Promise<string | null> {
    const searchDirs = [
      path.join(process.cwd(), 'public', 'backgrounds'),
      path.join(process.cwd(), 'files', 'backgrounds'),
      path.join(process.cwd(), 'files'),
      path.join(process.cwd(), 'src', 'files', 'backgrounds'),
      path.join(process.cwd(), 'src', 'files'),
    ];
    const videos: string[] = [];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }

      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) {
          continue;
        }

        const filePath = path.join(dir, entry.name);
        const extension = path.extname(entry.name).toLowerCase();

        if (['.mp4', '.mov', '.webm', '.mkv'].includes(extension)) {
          videos.push(filePath);
        }
      }
    }

    if (videos.length === 0) {
      return null;
    }

    return videos[runCount % videos.length];
  }
}
