import CryptoJS from 'crypto-js';

import { env } from '@/config/env-config';

enum ResponseType {
  Sucess = 'success',
  Failure = 'failure',
}

interface Response {
  Status: typeof ResponseType.Sucess | typeof ResponseType.Failure;
  Message: string;
  Errors: string[] | null;
  Payload: string | object | null;
}

const encrypt = (body: Record<string, any>): string => {
  const secretKey = env.DECRYPTSECRET;
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(body), key, {
    iv: CryptoJS.enc.Utf8.parse(env.IV || ''),
    mode: CryptoJS.mode.CBC,
  });
  return encryptedData.toString();
};

export function BuildSuccessResponse(message: string, payload: Record<string, any>): Response {
  const encryptedPayload = encrypt(payload);
  const res: Response = {
    Status: ResponseType.Sucess,
    Message: message,
    Errors: null,
    Payload: encryptedPayload,
  };

  return res;
}

export function BuildErrorResponse(message: string, errors: Error): Response {
  const splittedErrors = errors.message.split('\n');
  const res: Response = {
    Status: ResponseType.Failure,
    Message: message,
    Errors: splittedErrors,
    Payload: null,
  };

  return res;
}

export function BuildUserErrorResponse(message: string, errors: unknown = null): Response {
  return {
    Status: ResponseType.Failure,
    Message: message,
    Errors: errors instanceof Array ? errors : null,
    Payload: null,
  };
}

const decrypt = (encryptedPayload: string): Record<string, any> => {
  const secretKey = env.DECRYPTSECRET;
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const iv = CryptoJS.enc.Utf8.parse(env.IV || '');

  const decryptedBytes = CryptoJS.AES.decrypt(encryptedPayload, key, {
    iv,
    mode: CryptoJS.mode.CBC,
  });

  const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedText) {
    throw new Error('Failed to decrypt payload');
  }

  return JSON.parse(decryptedText);
};
