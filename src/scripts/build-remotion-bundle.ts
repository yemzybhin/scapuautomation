import { bundle } from '@remotion/bundler';
import fs from 'fs';
import path from 'path';

/**
 * Builds the Remotion bundle at deploy time.
 *
 * Bundling is the single largest memory spike in the render path (webpack peaks
 * in the hundreds of megabytes). Doing it here means the 512MB runtime container
 * never runs webpack at all, not even on its first render.
 */
const main = async () => {
  const outputDir = path.join(process.cwd(), 'remotion-bundle');

  await fs.promises.rm(outputDir, { recursive: true, force: true });

  const location = await bundle({
    entryPoint: path.resolve(process.cwd(), 'src/video/index.tsx'),
    outDir: outputDir,
  });

  console.log('Remotion bundle built at', location);
  process.exit(0);
};

main().catch(error => {
  console.error('Remotion bundle build failed:', error);
  process.exit(1);
});
