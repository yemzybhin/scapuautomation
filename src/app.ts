import express, { Application, Request, Response } from 'express';

import { HTTP_STATUS } from './constants/httpStatus';
import { loggerMiddleware, pinoLogger } from './middleware/pino-logger';

const app: Application = express();

app.set('trust proxy', true);

app.use(express.json({ limit: '10mb' }));
app.use(loggerMiddleware);
app.use(pinoLogger);
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', async (_req: Request, res: Response): Promise<void | Response> => {
  return res.status(HTTP_STATUS.OK).json({ status: 'ok', message: 'API running' });
});

app.get('/heartbeat', async (req: Request, res: Response): Promise<void | Response> => {
  req.log.info('Heartbeat ok');
  return res.status(HTTP_STATUS.OK).json({ status: 'ok' });
});

export { app };
