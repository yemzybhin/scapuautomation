import { app } from './app.js';
import { env } from './config/env-config';
import CronManager from './cron/index';
import { logger } from './middleware/pino-logger';

class Server {
  private readonly port: number | string;
  private serverInstance: any;
  private childProcess: any = null;

  constructor(port: number | string) {
    this.port = port;
  }

  public async start(): Promise<void> {
    try {
      this.serverInstance = app.listen(this.port, () => {
        logger.info(`Server running at http://localhost:${this.port}`);
      });

      CronManager.startAll();
    } catch (err) {
      console.error('🔥 FULL ERROR BELOW 🔥');
      console.error(err);
      console.dir(err, { depth: null });

      if (err instanceof Error) {
        console.error('MESSAGE:', err.message);
        console.error('STACK:', err.stack);
      } else {
        console.error('NOT AN ERROR OBJECT');
      }

      logger.fatal({ err }, `Failed to start server ${JSON.stringify(err)}`);
      process.exit(1);
    }
  }
}

const PORT = Number(env.PORT) || 4000;
const server = new Server(PORT);
server.start();
