import { FieldValue } from 'firebase-admin/firestore';

import { getPlacardFirestore } from '@/config/firebase';
import { OpinionPlacardCategory } from '@/constants/opinionPlacard';
import { PlacardRegion } from '@/constants/opinionPlacardRegions';

export type PlacardPlatform = 'youtube' | 'linkedin';

export type PlatformPostState = {
  posted: boolean;
  attempts: number;
  postedAt: string | null;
  url: string | null;
  externalId: string | null;
  error: string | null;
};

export type PlacardStatus = 'generated' | 'partially_posted' | 'posted' | 'failed';

export type OpinionPlacardDoc = {
  slug: string;
  question: string;
  authorName: string;
  category: OpinionPlacardCategory;
  region: PlacardRegion;
  countryCode: string;
  personaLocale: string;
  avatarProvider: string | null;
  trendKey: string;
  questionKey: string;
  timestamp: string;
  verified: boolean;
  agreeVotes: number;
  disagreeVotes: number;
  trend: Record<string, unknown> | null;
  imageUrl: string;
  videoUrl: string | null;
  avatarUrl: string | null;
  storagePaths: {
    image: string;
    video: string | null;
    avatar: string | null;
  };
  status: PlacardStatus;
  platforms: Record<PlacardPlatform, PlatformPostState>;
  createdAt: string;
  updatedAt: string;
};

export const PLACARD_PLATFORMS: PlacardPlatform[] = ['youtube', 'linkedin'];

export const emptyPlatformState = (): PlatformPostState => ({
  posted: false,
  attempts: 0,
  postedAt: null,
  url: null,
  externalId: null,
  error: null,
});

export class OpinionPlacardRepository {
  private readonly collectionName = 'opinion_placards';

  private get collection() {
    return getPlacardFirestore().collection(this.collectionName);
  }

  public async createPlacard(doc: OpinionPlacardDoc): Promise<void> {
    await this.collection.doc(doc.slug).set(doc);
  }

  public async updatePlatformResult(
    slug: string,
    platform: PlacardPlatform,
    result: Partial<PlatformPostState>,
    countsAsAttempt = true,
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (countsAsAttempt) {
      updates[`platforms.${platform}.attempts`] = FieldValue.increment(1);
    }

    for (const [key, value] of Object.entries(result)) {
      updates[`platforms.${platform}.${key}`] = value;
    }

    await this.collection.doc(slug).update(updates);
  }

  public async updateStatus(slug: string, status: PlacardStatus): Promise<void> {
    await this.collection.doc(slug).update({
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Run counters live in Firestore so a restart does not reset the region
   * rotation (which would skew the country mix) or replay the same trends.
   */
  public async getPipelineState(): Promise<{ runCount: number; categoryIndex: number } | null> {
    try {
      const snapshot = await getPlacardFirestore()
        .collection('placard_pipeline_state')
        .doc('opinion_placards')
        .get();

      if (!snapshot.exists) {
        return null;
      }

      const data = snapshot.data() as { runCount?: number; categoryIndex?: number };

      return {
        runCount: Number(data.runCount ?? 0),
        categoryIndex: Number(data.categoryIndex ?? 0),
      };
    } catch {
      return null;
    }
  }

  public async savePipelineState(runCount: number, categoryIndex: number): Promise<void> {
    try {
      await getPlacardFirestore()
        .collection('placard_pipeline_state')
        .doc('opinion_placards')
        .set({ runCount, categoryIndex, updatedAt: new Date().toISOString() });
    } catch {
      // Losing the counter only costs rotation accuracy, so never fail the run.
    }
  }

  public async getPlacard(slug: string): Promise<OpinionPlacardDoc | null> {
    const snapshot = await this.collection.doc(slug).get();

    return snapshot.exists ? (snapshot.data() as OpinionPlacardDoc) : null;
  }

  public async getRetryablePlacards(
    limit: number,
    maxAttempts: number,
    platforms: PlacardPlatform[] = PLACARD_PLATFORMS,
  ): Promise<OpinionPlacardDoc[]> {
    // Order in the query rather than in memory: a bare limit would drop the newest
    // placards before the filters below ever see them.
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .limit(Math.max(limit * 10, 30))
      .get();

    return snapshot.docs
      .map(doc => doc.data() as OpinionPlacardDoc)
      .filter(doc => ['generated', 'partially_posted', 'failed'].includes(doc.status))
      .filter(doc => Boolean(doc.videoUrl))
      .filter(doc =>
        platforms.some(
          platform =>
            !doc.platforms?.[platform]?.posted &&
            (doc.platforms?.[platform]?.attempts ?? 0) < maxAttempts,
        ),
      )
      .slice(0, limit);
  }
}
