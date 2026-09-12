import OpinionPlacardCronService from '@/cron/OpinionPlacardCronService';

// Optional run number so a single run can target a specific slot in the region
// rotation, e.g. `npm run placard:test 1` for the United States.
const runCount = Number(process.argv[2]);

await OpinionPlacardCronService.processNext(Number.isFinite(runCount) ? runCount : undefined);
