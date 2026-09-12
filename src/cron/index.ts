import cron from 'node-cron';

import { CRON_SCHEDULES } from '@/helpers/cronSchedules';
import { logger } from '@/middleware/pino-logger';

import OpinionPlacardCronService from './OpinionPlacardCronService';

class CronManager {
  private opinionPlacardCronStarted = false;

  public startAll(): void {
    this.startOpinionPlacardGenerationCron();
  }

  public startOpinionPlacardGenerationCron(): void {
    if (this.opinionPlacardCronStarted) {
      logger.warn('Opinion placard cron has already been started');
      return;
    }

    this.startOpinionPlacardCron();

    this.opinionPlacardCronStarted = true;
    logger.info('Opinion placard cron jobs started');
  }

  private startOpinionPlacardCron(): void {
    logger.info('Opinion Placard cron started');
    cron.schedule(CRON_SCHEDULES.hourly, async () => {
      await OpinionPlacardCronService.processNext();
    });
    cron.schedule(CRON_SCHEDULES.hourly, async () => {
      await OpinionPlacardCronService.retryPendingPublishes();
    });
  }
}

export default new CronManager();
