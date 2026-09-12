import { config } from 'dotenv';

import { envSchema, EnvVars } from './env-schema.js';

config();

type GenerationConfig = {
  factModel: string;
  imageModel: string;
};

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missingKeys = Object.keys(parsed.error.format()).filter(k => k !== '_errors');
  console.error(`Missing/invalid environment variables: ${missingKeys.join(', ')}`);
  process.exit(1);
}

const data = parsed.data;

const isRender = data.RENDER === 'true' || Boolean(data.RENDER_EXTERNAL_URL);

export const GenerationConfig: GenerationConfig = {
  factModel: 'gemini-3.1-flash-lite-preview',
  imageModel: 'gemini-2.5-flash-image',
};

export const env: EnvVars & { devMode: boolean; isRender: boolean } = {
  ...data,
  isRender,
  devMode: !isRender,
};
