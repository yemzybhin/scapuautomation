import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { env } from './env-config.js';

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let app: App | null = null;

const getFirebaseApp = (): App => {
  if (app) {
    return app;
  }

  if (!env.SCAPU_ADMIN_KEY) {
    throw new Error('SCAPU_ADMIN_KEY is not configured; Firebase features are unavailable');
  }

  const serviceAccount = JSON.parse(env.SCAPU_ADMIN_KEY) as ServiceAccountJson;

  app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });

  return app;
};

export const getPlacardFirestore = (): Firestore => getFirestore(getFirebaseApp());

export const getPlacardBucket = () => getStorage(getFirebaseApp()).bucket();
