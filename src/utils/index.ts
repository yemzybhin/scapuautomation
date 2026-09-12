import mongoose from 'mongoose';

import { env } from '@/config/env-config';

export function isWorkEmail(email: string) {
  return !/@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|icloud\.com|aol\.com)$/i.test(email);
}
export const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// function to convert string uuid to mongoose object Id
export const toId = (userId: string) => {
  return new mongoose.Types.ObjectId(userId);
};

export const cleanText = (input?: string): string => {
  if (!input) return '';

  let str = input;
  const replacements: Record<string, string> = {
    ΓÇÖ: "'",
    'ΓÇ£': '"',
    'ΓÇ¥': '"',
    ΓÇô: '-',
    ΓÇö: '-',
    '├ó': 'o',
    '├ä': 'a',
    '├©': 'e',
    '├í': 'i',
    '├║': 'u',
    '├╢': 'ö',
    '├╣': 'ü',
    '├ñ': 'ñ',
    Â: '',
  };

  for (const [bad, good] of Object.entries(replacements)) {
    str = str.split(bad).join(good);
  }
  str = str.normalize('NFKC');
  str = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
};

const geminiApiKeys = [
  { envName: 'GEMINI_FREE_API_KEY', key: env.GEMINI_FREE_API_KEY },
  // { envName: 'GEMINI_FREE_API_KEY_NEXUS', key: env.GEMINI_FREE_API_KEY_NEXUS },
  {
    envName: 'GEMINI_FREE_API_KEY_ODUYUNGBOADEYEMI',
    key: env.GEMINI_FREE_API_KEY_ODUYUNGBOADEYEMI,
  },
  { envName: 'GEMINI_FREE_API_KEY_YEMISCARTOON', key: env.GEMINI_FREE_API_KEY_YEMISCARTOON },
  { envName: 'GEMINI_FREE_API_KEY_ADURA_IMOLE', key: env.GEMINI_FREE_API_KEY_ADURA_IMOLE },
  { envName: 'GEMINI_FREE_API_KEY_NEWGENMOBILE', key: env.GEMINI_FREE_API_KEY_NEWGENMOBILE },
];

export const getApikeyFromCount = (count: number): string => {
  console.log('count: ', count);
  const keyIndex = count % geminiApiKeys.length;
  return geminiApiKeys[keyIndex].key;
};

export const getApikeyInfoFromCount = (count: number) => {
  console.log('count: ', count);
  const keyIndex = count % geminiApiKeys.length;
  return {
    key: geminiApiKeys[keyIndex].key,
    keyIndex,
    envName: geminiApiKeys[keyIndex].envName,
  };
};
