import fs from 'fs';
import path from 'path';

import { env } from '@/config/env-config';
import { logger } from '@/middleware/pino-logger';
import { RenderedOpinionPlacard } from '@/services/OpinionPlacardGenerationService';

/**
 * Local output for test runs. When social publishing is disabled nothing is
 * uploaded to Firebase and no Firestore document is written, so a test placard
 * can never end up in the retry queue and get posted once publishing is
 * switched back on. The files are overwritten on every run by design.
 */
export class PlacardTestOutputService {
  public async save(rendered: RenderedOpinionPlacard): Promise<string> {
    const outputDir = path.isAbsolute(env.PLACARD_TEST_OUTPUT_DIR)
      ? env.PLACARD_TEST_OUTPUT_DIR
      : path.join(process.cwd(), env.PLACARD_TEST_OUTPUT_DIR);

    await fs.promises.mkdir(outputDir, { recursive: true });

    const videoTarget = path.join(outputDir, 'video.mp4');
    const imageTarget = path.join(outputDir, 'placard.png');

    if (rendered.videoPath) {
      await fs.promises.copyFile(rendered.videoPath, videoTarget);
    }

    await fs.promises.copyFile(rendered.pngPath, imageTarget);

    // A sidecar makes it obvious which region and persona produced the video.
    await fs.promises.writeFile(
      path.join(outputDir, 'placard.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          region: rendered.region,
          countryCode: rendered.countryCode,
          personaLocale: rendered.personaLocale,
          avatarProvider: rendered.avatarProvider,
          category: rendered.category,
          authorName: rendered.draft.authorName,
          question: rendered.draft.question,
          trendTitle: rendered.trend?.title ?? null,
        },
        null,
        2,
      ),
    );

    logger.info(
      { outputDir, region: rendered.region, countryCode: rendered.countryCode },
      'Social publishing disabled; placard written to local test folder',
    );

    return outputDir;
  }
}
