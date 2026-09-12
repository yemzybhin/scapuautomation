import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(2000),

  JWT_EXP: z.string().default('2d'),
  BCRYPT_SALT: z.string().default('7'),
  CLIENT_ID: z.string().optional(),
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),
  GOOGLE_WEB_CLIENT_ID: z.string().optional(),
  IV: z.string().default('7a3e4f90b8c12d18'),
  DECRYPTSECRET: z.string().default('7a3e4f90b8c12d18e7f6a542c09e3b32'),
  // APIs
  GEMINI_FREE_API_KEY: z.string().optional(),
  GEMINI_FREE_API_KEY_NEXUS: z.string().optional(),

  GEMINI_FREE_API_KEY_ODUYUNGBOADEYEMI: z.string().optional(),
  GEMINI_FREE_API_KEY_YEMISCARTOON: z.string().optional(),
  GEMINI_FREE_API_KEY_ADURA_IMOLE: z.string().optional(),
  GEMINI_FREE_API_KEY_NEWGENMOBILE: z.string().optional(),

  GEMINI_PAID_API_KEY: z.string().optional(),
  PUTER_AUTH_TOKEN: z.string().optional(),
  GPT_PAID_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),

  // Remotion rendering. Defaults are tuned for a small container: rendering is
  // memory bound, and extra concurrency is what gets Chrome OOM-killed.
  REMOTION_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(1),
  REMOTION_TIMEOUT_MS: z.coerce.number().int().min(30000).default(900000),
  // Decoded frames are held in memory; a small cap matters on a 512MB container.
  REMOTION_VIDEO_CACHE_BYTES: z.coerce.number().int().min(0).default(67108864),

  // Background footage. Images render markedly faster than video, so they are
  // the default; 'video' keeps the stock-clip path, 'none' the generated one.
  PEXELS_API_KEY: z.string().optional(),
  BACKGROUND_MODE: z.enum(['image', 'video', 'none']).default('image'),
  SOUNDTRACK_ENABLED: z
    .preprocess(value => (value === undefined ? true : String(value).toLowerCase() === 'true'), z.boolean())
    .default(true),
  SOUNDTRACK_VOLUME: z.coerce.number().min(0).max(1).default(0.4),

  // Avatars
  AVATAR_PROVIDER: z
    .enum(['auto', 'generated_photos', 'ai_horde', 'dicebear', 'randomuser'])
    .default('auto'),
  GENERATED_PHOTOS_API_KEY: z.string().optional(),
  AI_HORDE_API_KEY: z.string().default('0000000000'),

  // Local output used when social publishing is disabled
  PLACARD_TEST_OUTPUT_DIR: z.string().default('social'),

  // Firebase admin (service account JSON)
  SCAPU_ADMIN_KEY: z.string().optional(),

  // Social publishing
  SOCIAL_PUBLISHING_ENABLED: z
    .preprocess(value => {
      if (value === undefined) {
        return false;
      }

      return String(value).toLowerCase() === 'true';
    }, z.boolean())
    .default(false),

  // YouTube publishing
  YOUTUBE_API_KEY: z.string().optional(),
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REFRESH_TOKEN: z.string().optional(),
  YOUTUBE_CHANNEL_ID: z.string().optional(),
  YOUTUBE_PRIVACY_STATUS: z.enum(['private', 'unlisted', 'public']).default('private'),
  YOUTUBE_CATEGORY_ID: z.string().default('28'),

  // LinkedIn publishing
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  LINKEDIN_PERSON_URN: z.string().optional(),
  LINKEDIN_ORG_URN: z.string().optional(),

  // TikTok publishing
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  TIKTOK_ACCESS_TOKEN: z.string().optional(),
  TIKTOK_OPEN_ID: z.string().optional(),
  TIKTOK_PRIVACY_LEVEL: z
    .enum(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'])
    .default('SELF_ONLY'),

  // Facebook Page publishing
  FACEBOOK_PAGE_ID: z.string().optional(),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
  FACEBOOK_GRAPH_API_VERSION: z.string().default('v23.0'),

  // Other (from original)
  SESSION_SECRET: z.string().optional(),
  DAILY_API_KEY: z.string().optional(),
  RENDER: z.string().optional(),
  RENDER_EXTERNAL_URL: z.string().optional(),
});

export type EnvVars = z.infer<typeof envSchema>;
