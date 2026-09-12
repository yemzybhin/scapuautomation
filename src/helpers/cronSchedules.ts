export const CRON_SCHEDULES = {
  everySecond: '* * * * * *',
  everyMinute: '* * * * *',
  every2Minutes: '*/2 * * * *',
  every3Minutes: '*/3 * * * *',
  every5Minutes: '*/5 * * * *',
  every10Minutes: '*/10 * * * *',
  every15Minutes: '*/15 * * * *',
  every30Minutes: '*/30 * * * *',

  hourly: '0 * * * *',
  every2Hours: '0 */2 * * *',
  every6Hours: '0 */6 * * *',
  every12Hours: '0 */12 * * *',

  dailyMidnight: '0 0 * * *',
  dailyNoon: '0 12 * * *',

  weeklySundayMidnight: '0 0 * * 0',
  weeklyMondayMidnight: '0 0 * * 1',

  monthlyStart: '0 0 1 * *',
  monthlyEnd: '0 0 28-31 * *',

  everyYearJan1st: '0 0 1 1 *',
};
