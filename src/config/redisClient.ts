import { createClient } from 'redis';

import { env } from './env-config';

export const isRedisEnabled = env.REDIS_ENABLED && Boolean(env.REDIS_URL);

const redisClient = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  socket: {
    host: env.REDIS_URL,
    port: 12539,
    reconnectStrategy: retries => Math.min(retries * 50, 1000),
  },
});

redisClient.on('error', err => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'));

export default redisClient;
