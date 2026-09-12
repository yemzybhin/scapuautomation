import {
  pickCategoryForCountry,
  pickRegionForRun,
  resolveCountry,
} from '@/constants/opinionPlacardRegions';
import { logger } from '@/middleware/pino-logger';
import { OpinionPlacardGenerationService } from '@/services/OpinionPlacardGenerationService';
import { OpinionPlacardPipelineService } from '@/services/OpinionPlacardPipelineService';
import { OpinionPlacardRepository } from '@/services/OpinionPlacardRepository';
import { DuplicatePlacardError } from '@/services/PlacardDedupeService';

class OpinionPlacardCronService {
  private readonly pipelineService = new OpinionPlacardPipelineService();
  private readonly repository = new OpinionPlacardRepository();
  private stateRestored = false;

  private getState(): ProcessorState {
    return {
      categoryIndex: (opinionPlacardProcessorCache.get(KEYS.CATEGORY_INDEX) as number) ?? 0,
      runCount: (opinionPlacardProcessorCache.get(KEYS.RUN_COUNT) as number) ?? 0,
      isProcessing: (opinionPlacardProcessorCache.get(KEYS.IS_PROCESSING) as boolean) ?? false,
    };
  }

  private setState(updates: Partial<ProcessorState>) {
    if (updates.categoryIndex !== undefined) {
      opinionPlacardProcessorCache.set(KEYS.CATEGORY_INDEX, updates.categoryIndex);
    }
    if (updates.runCount !== undefined) {
      opinionPlacardProcessorCache.set(KEYS.RUN_COUNT, updates.runCount);
    }
    if (updates.isProcessing !== undefined) {
      opinionPlacardProcessorCache.set(KEYS.IS_PROCESSING, updates.isProcessing);
    }
  }

  public async processNext(runCountOverride?: number): Promise<void> {
    if (runCountOverride === undefined) {
      await this.restorePersistedState();
    }

    const state = this.getState();

    if (runCountOverride !== undefined) {
      state.runCount = runCountOverride;
      state.categoryIndex = runCountOverride;
    }

    if (state.isProcessing) {
      logger.info('Opinion placard generation is already running');
      return;
    }

    this.setState({ isProcessing: true });

    try {
      // Region first: it decides which trends, persona and categories apply.
      const region = pickRegionForRun(state.runCount);
      const country = resolveCountry(region, state.runCount);
      const category = pickCategoryForCountry(country, state.categoryIndex);

      logger.info(
        { region, country: country.code, category },
        'Opinion placard generation started',
      );

      const service = new OpinionPlacardGenerationService(
        category,
        state.runCount,
        region,
        country,
      );
      const result = await service.generate();

      logger.info(
        {
          category: result.category,
          region: result.region,
          countryCode: result.countryCode,
          authorName: result.draft.authorName,
          avatarProvider: result.avatarProvider,
          slug: result.slug,
        },
        'Opinion placard generated',
      );

      const doc = await this.pipelineService.process(result);

      if (doc) {
        logger.info(
          {
            slug: doc.slug,
            region: doc.region,
            imageUrl: doc.imageUrl,
            videoUrl: doc.videoUrl,
            status: doc.status,
          },
          'Opinion placard saved to Firebase',
        );
      }

      this.setState({
        categoryIndex: state.categoryIndex + 1,
        runCount: state.runCount + 1,
      });
    } catch (error) {
      if (error instanceof DuplicatePlacardError) {
        // Skipping a slot is the correct outcome here, not a failure.
        logger.warn({ reason: error.message }, 'Skipped placard slot to avoid duplicate content');
      } else {
        logger.error({ error }, 'Opinion placard generation failed');
      }

      this.setState({
        categoryIndex: state.categoryIndex + 1,
        runCount: state.runCount + 1,
      });
    } finally {
      this.setState({ isProcessing: false });

      if (runCountOverride === undefined) {
        const latest = this.getState();
        await this.repository.savePipelineState(latest.runCount, latest.categoryIndex);
      }

      logger.info('Opinion placard generation lock released');
    }
  }

  /** Loads counters from Firestore once per process so restarts resume the rotation. */
  private async restorePersistedState(): Promise<void> {
    if (this.stateRestored) {
      return;
    }

    this.stateRestored = true;

    const persisted = await this.repository.getPipelineState();

    if (!persisted) {
      return;
    }

    this.setState({ runCount: persisted.runCount, categoryIndex: persisted.categoryIndex });
    logger.info(
      { runCount: persisted.runCount, categoryIndex: persisted.categoryIndex },
      'Restored opinion placard pipeline counters',
    );
  }

  public async retryPendingPublishes(): Promise<void> {
    try {
      await this.pipelineService.retryPendingPublishes();
    } catch (error) {
      logger.error({ error }, 'Opinion placard publish retry run failed');
    }
  }
}

type ProcessorState = {
  categoryIndex: number;
  runCount: number;
  isProcessing: boolean;
};

const opinionPlacardProcessorCache: Map<string, number | boolean> = new Map();

const KEYS = {
  CATEGORY_INDEX: 'categoryIndex',
  RUN_COUNT: 'runCount',
  IS_PROCESSING: 'isProcessing',
};

export default new OpinionPlacardCronService();
