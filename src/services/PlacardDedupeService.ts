import { getPlacardFirestore } from '@/config/firebase';
import { logger } from '@/middleware/pino-logger';

/** Filler words carry no topic signal, so they are ignored when comparing takes. */
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'am',
  'do',
  'does',
  'did',
  'has',
  'have',
  'had',
  'will',
  'would',
  'can',
  'could',
  'should',
  'and',
  'or',
  'but',
  'if',
  'then',
  'than',
  'that',
  'this',
  'these',
  'those',
  'to',
  'of',
  'in',
  'on',
  'at',
  'for',
  'with',
  'from',
  'by',
  'as',
  'it',
  'its',
  'we',
  'us',
  'our',
  'you',
  'your',
  'they',
  'them',
  'their',
  'i',
  'me',
  'my',
  'he',
  'she',
  'his',
  'her',
  'who',
  'what',
  'when',
  'why',
  'how',
  'just',
  'really',
  'actually',
  'honestly',
  'now',
  'still',
  'even',
  'so',
  'like',
  'not',
  'no',
  'yes',
  'all',
  'any',
  'some',
  'more',
  'most',
  'ever',
  'every',
  'about',
  'out',
  'up',
  'down',
  'too',
  'very',
  'lately',
]);

export type RecentQuestion = {
  tokens: Set<string>;
  entities: Set<string>;
  category: string;
};

export type DedupeContext = {
  trendKeys: Set<string>;
  questionKeys: Set<string>;
  recentQuestions: RecentQuestion[];
  recentOpeners: string[];
};

export const EMPTY_DEDUPE_CONTEXT: DedupeContext = {
  trendKeys: new Set(),
  questionKeys: new Set(),
  recentQuestions: [],
  recentOpeners: [],
};

/** Raised when a freshly drafted take repeats something already published. */
export class DuplicatePlacardError extends Error {}

export const buildTrendKey = (title?: string | null): string =>
  (title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const buildQuestionKey = (question: string): string =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const tokenizeQuestion = (question: string): Set<string> =>
  new Set(
    buildQuestionKey(question)
      .split(' ')
      .filter(token => token.length > 2 && !STOPWORDS.has(token)),
  );

/**
 * Overlap relative to the shorter take. Plain Jaccard is too forgiving here: two
 * posts about the same subject worded differently share few total tokens, but a
 * high share of the shorter one's meaningful words.
 */
export const containmentSimilarity = (left: Set<string>, right: Set<string>): number => {
  const smaller = left.size <= right.size ? left : right;

  if (smaller.size === 0) {
    return 0;
  }

  let shared = 0;

  for (const token of smaller) {
    if (left.has(token) && right.has(token)) {
      shared += 1;
    }
  }

  return shared / smaller.size;
};

/**
 * Pulls out named subjects such as "Academy Sports" or "Premier League".
 * Two takes can share almost no wording yet still be about the same thing, which
 * plain token overlap scores far too low to catch.
 */
export const extractEntities = (text: string): Set<string> => {
  const entities = new Set<string>();
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    const words = sentence
      .split(' ')
      .map(word => word.trim())
      .filter(Boolean);
    let run: string[] = [];

    const flush = (isSentenceStart: boolean) => {
      if (run.length >= 2 || (run.length === 1 && !isSentenceStart)) {
        entities.add(run.join(' ').toLowerCase());
      }

      run = [];
    };

    words.forEach((word, index) => {
      const cleaned = word.replace(/[^A-Za-z0-9'-]/g, '');
      const isCapitalised = /^[A-Z][a-zA-Z'-]+$/.test(cleaned);

      if (isCapitalised && !STOPWORDS.has(cleaned.toLowerCase())) {
        run.push(cleaned);
        return;
      }

      // A capitalised first word is grammar, not a name, so a lone one is
      // only kept when it appears mid-sentence.
      flush(index - run.length === 0);
    });

    flush(words.length - run.length === 0);
  }

  return entities;
};

export class PlacardDedupeService {
  private readonly collectionName = 'opinion_placards';
  private readonly contentKeyCollection = 'placard_content_keys';
  private readonly similarityThreshold = 0.5;

  /**
   * Recent history used to steer generation away from repeats. Failures are
   * swallowed: losing dedupe context should degrade variety, not stop the run.
   */
  public async getRecentContext(limit = 200): Promise<DedupeContext> {
    try {
      const snapshot = await getPlacardFirestore()
        .collection(this.collectionName)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const context: DedupeContext = {
        trendKeys: new Set(),
        questionKeys: new Set(),
        recentQuestions: [],
        recentOpeners: [],
      };

      for (const doc of snapshot.docs) {
        const data = doc.data() as {
          question?: string;
          category?: string;
          trend?: { title?: string } | null;
        };

        if (data.trend?.title) {
          context.trendKeys.add(buildTrendKey(data.trend.title));
        }

        if (data.question) {
          context.questionKeys.add(buildQuestionKey(data.question));
          context.recentQuestions.push({
            tokens: tokenizeQuestion(data.question),
            entities: new Set([
              ...extractEntities(data.question),
              ...extractEntities(data.trend?.title ?? ''),
            ]),
            category: String(data.category ?? ''),
          });

          const opener = data.question
            .split(/[\s,]+/)
            .slice(0, 2)
            .join(' ');

          if (opener) {
            context.recentOpeners.push(opener);
          }
        }
      }

      logger.info(
        { trends: context.trendKeys.size, questions: context.questionKeys.size },
        'Loaded placard dedupe context from Firebase',
      );

      return context;
    } catch (error) {
      logger.warn({ error }, 'Could not load dedupe context; continuing without it');
      return EMPTY_DEDUPE_CONTEXT;
    }
  }

  public isDuplicateQuestion(
    question: string,
    context: DedupeContext,
    category?: string,
    trendTitle?: string | null,
  ): boolean {
    if (context.questionKeys.has(buildQuestionKey(question))) {
      return true;
    }

    const tokens = tokenizeQuestion(question);
    const entities = new Set([...extractEntities(question), ...extractEntities(trendTitle ?? '')]);

    return context.recentQuestions.some(previous => {
      if (containmentSimilarity(tokens, previous.tokens) >= this.similarityThreshold) {
        return true;
      }

      // Same named subject inside the same category is a repeat even when the
      // wording differs completely.
      if (category && previous.category && category !== previous.category) {
        return false;
      }

      return [...entities].some(entity => previous.entities.has(entity));
    });
  }

  /**
   * Claims a content key so two overlapping runs cannot publish the same take.
   * `create` fails if the document exists, which makes this atomic.
   */
  public async reserveContentKey(key: string, slug: string): Promise<boolean> {
    if (!key) {
      return true;
    }

    try {
      await getPlacardFirestore()
        .collection(this.contentKeyCollection)
        .doc(this.toDocId(key))
        .create({ key, slug, reservedAt: new Date().toISOString() });

      return true;
    } catch {
      logger.warn({ slug }, 'Content key already reserved; treating placard as duplicate');
      return false;
    }
  }

  /** Firestore ids cannot contain slashes and are capped in length. */
  private toDocId(key: string): string {
    return key.replace(/[^a-z0-9]+/g, '-').slice(0, 400);
  }
}
