import { env } from '@/config/env-config.js';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ensureDir } from 'fs-extra';
import { dirname, join } from 'path';
import pino, { Logger } from 'pino';
import pinoHttp from 'pino-http';
import { fileURLToPath } from 'url';

declare global {
  namespace Express {
    interface Request {
      log: Logger;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logDir = join(__dirname, '..', 'logs');
const logFile = join(logDir, 'app.log');

(async () => {
  try {
    await ensureDir(logDir);
  } catch (err) {
    console.error('Failed to create log directory:', err);
  }
})();

const transport =
  env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:mm:ss',
          ignore: 'pid,hostname,req,res',
        },
      }
    : {
        target: 'pino/file',
        options: { destination: logFile },
      };

export const logger = pino({
  level: 'info',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname,req,res',
          },
        }
      : undefined,
});

export const pinoLogger = pinoHttp({
  logger,
  genReqId: (req: Request) => randomUUID(),
  customSuccessMessage: (req: Request, res: Response) => {
    return `${req.method} ${req.url} [reqId: ${req.id}] completed`;
  },
  customErrorMessage: (req: Request, res: Response, err: Error) => {
    return `${req.method} ${req.url} [reqId: ${req.id}] failed with ${err.message}`;
  },
});

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.log = logger;
  next();
};
