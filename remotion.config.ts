import { Config } from '@remotion/cli/config';
import path from 'path';

Config.overrideWebpackConfig(currentConfiguration => {
  currentConfiguration.resolve = {
    ...currentConfiguration.resolve,

    alias: {
      ...(currentConfiguration.resolve?.alias ?? {}),

      '@': path.resolve(__dirname, 'src'),
    },
  };

  return currentConfiguration;
});