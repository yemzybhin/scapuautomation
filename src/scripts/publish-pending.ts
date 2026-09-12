import { OpinionPlacardPipelineService } from '@/services/OpinionPlacardPipelineService';

const limit = Number(process.argv[2]) || 1;

const pipelineService = new OpinionPlacardPipelineService();

await pipelineService.retryPendingPublishes(limit);
// Give the async logger a moment to flush before forcing exit past Firestore's open handles.
await new Promise(resolve => setTimeout(resolve, 1500));
process.exit(0);
