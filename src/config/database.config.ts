import dns from 'node:dns';

import mongoose from 'mongoose';

import { logger } from '../middleware/pino-logger';
import { env } from './env-config';

export class DatabaseService {
  private static instance: DatabaseService | null = null;

  private constructor() {}

  public static async getInstance(): Promise<DatabaseService> {
    if (!this.instance) {
      this.instance = new DatabaseService();
      try {
        const mongoUri = env.MONGO_URI;
        if (!mongoUri) {
          throw new Error('MONGO_URI is not defined in environment variables');
        }

        if (env.MONGO_DNS_SERVERS) {
          const dnsServers = env.MONGO_DNS_SERVERS.split(',')
            .map(server => server.trim())
            .filter(Boolean);

          if (dnsServers.length > 0) {
            dns.setServers(dnsServers);
            logger.info({ dnsServers }, 'Using custom DNS servers for MongoDB connection');
          }
        }

        await mongoose.connect(mongoUri);
        logger.info('MongoDB connected successfully');

        mongoose.connection.on('error', err => {
          logger.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });
      } catch (err) {
        logger.error(`Failed to connect to MongoDB: ${err}`);
        throw err;
      }
    }
    return this.instance;
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
}
