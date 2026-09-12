import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

import { AvatarService } from '@/avatars/AvatarService';
import { env, GenerationConfig } from '@/config/env-config';
import { OPINION_PLACARD_CATEGORIES, OpinionPlacardCategory } from '@/constants/opinionPlacard';
import { pickOpinionPlacardPersona } from '@/constants/opinionPlacardPersonas';
import { PlacardCountry, PlacardRegion } from '@/constants/opinionPlacardRegions';
import { logger } from '@/middleware/pino-logger';
import {
  OpinionTrendCandidate,
  OpinionTrendDiscoveryService,
} from '@/services/OpinionTrendDiscoveryService';
import {
  buildQuestionKey,
  buildTrendKey,
  DedupeContext,
  DuplicatePlacardError,
  PlacardDedupeService,
} from '@/services/PlacardDedupeService';
import { cleanText, getApikeyInfoFromCount } from '@/utils';
import { OpinionPlacardVideoGenerationService } from '@/video/OpinionPlacardVideoGenerationService';

type OpinionPlacardDraft = {
  authorName: string;
  question: string;
  category: OpinionPlacardCategory;
  timestamp: string;
  verified: boolean;
  agreeVotes: number;
  disagreeVotes: number;
  profileImagePrompt: string;
  backgroundVideoQuery: string;
};

export type RenderedOpinionPlacard = {
  category: OpinionPlacardCategory;
  region: PlacardRegion;
  countryCode: string;
  personaLocale: string;
  avatarProvider: string | null;
  trendKey: string;
  questionKey: string;
  slug: string;
  pngPath: string;
  videoPath: string | null;
  avatarPath: string | null;
  draft: OpinionPlacardDraft;
  trend: OpinionTrendCandidate | null;
};

export class OpinionPlacardGenerationService {
  private readonly modelName = GenerationConfig.factModel;
  private readonly outputRoot = path.join(os.tmpdir(), 'scapu-placards');

  private readonly avatarService = new AvatarService();
  private readonly dedupeService = new PlacardDedupeService();
  private avatarProvider: string | null = null;

  constructor(
    private readonly category: OpinionPlacardCategory,
    private readonly runCount: number,
    private readonly region: PlacardRegion,
    private readonly country: PlacardCountry,
  ) {}

  public async generate(): Promise<RenderedOpinionPlacard> {
    // What has already gone out, so this run can avoid repeating it.
    const dedupeContext = await this.dedupeService.getRecentContext();
    const trend = await this.getTrendCandidate(dedupeContext);
    const draft = await this.generateUniqueDraft(trend, dedupeContext);
    const outputDir = await this.ensureOutputDir();
    const slug = this.buildSlug(draft);
    const avatarPath = await this.generateAvatar(draft, outputDir, slug);
    const pngPath = path.join(outputDir, `${slug}.png`);

    const videoGenerationService = new OpinionPlacardVideoGenerationService();
    const generatedPngPath = await videoGenerationService.generateStillImage({
      authorName: draft.authorName,
      question: draft.question,
      category: draft.category,
      timestamp: draft.timestamp,
      verified: draft.verified,
      agreeVotes: draft.agreeVotes,
      disagreeVotes: draft.disagreeVotes,
      avatarPath,
      outputDir,
      slug,
      runCount: this.runCount,
    });

    if (!generatedPngPath) {
      throw new Error('Opinion placard PNG generation failed');
    }

    const videoPath = await videoGenerationService.generateVideo({
      backgroundVideoQuery: draft.backgroundVideoQuery,
      authorName: draft.authorName,
      question: draft.question,
      category: draft.category,
      timestamp: draft.timestamp,
      verified: draft.verified,
      agreeVotes: draft.agreeVotes,
      disagreeVotes: draft.disagreeVotes,
      avatarPath,
      outputDir,
      slug,
      runCount: this.runCount,
    });

    return {
      category: draft.category,
      region: this.region,
      countryCode: this.country.code,
      personaLocale: this.country.personaLocale,
      avatarProvider: this.avatarProvider,
      trendKey: buildTrendKey(trend?.title),
      questionKey: buildQuestionKey(draft.question),
      slug,
      pngPath,
      videoPath,
      avatarPath,
      draft,
      trend,
    };
  }

  private async getTrendCandidate(
    dedupeContext: DedupeContext,
  ): Promise<OpinionTrendCandidate | null> {
    const trendDiscoveryService = new OpinionTrendDiscoveryService();
    const candidates = await trendDiscoveryService.getRecentOpinionTrends(this.country);
    const unusedCandidates = candidates.filter(
      candidate => !dedupeContext.trendKeys.has(buildTrendKey(candidate.title)),
    );

    if (unusedCandidates.length === 0 && candidates.length > 0) {
      logger.warn('Every discovered trend has already been used; falling back to the full pool');
    }

    const pool = unusedCandidates.length > 0 ? unusedCandidates : candidates;

    return trendDiscoveryService.pickCandidateForCategory(pool, this.category, this.runCount);
  }

  /**
   * Drafts a take and rejects it if it repeats recent output. One retry is given
   * with the clashing take fed back in; a second clash aborts the run, because
   * posting a duplicate is worse than skipping a slot.
   */
  private async generateUniqueDraft(
    trend: OpinionTrendCandidate | null,
    dedupeContext: DedupeContext,
  ): Promise<OpinionPlacardDraft> {
    const attempts = 2;
    let lastQuestion: string | null = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const draft = await this.generateDraft(trend, dedupeContext, lastQuestion);
      const isDuplicate = this.dedupeService.isDuplicateQuestion(
        draft.question,
        dedupeContext,
        draft.category,
        trend?.title,
      );

      if (!isDuplicate) {
        return draft;
      }

      logger.warn(
        { attempt, question: draft.question },
        'Drafted opinion repeats recent output; regenerating',
      );
      lastQuestion = draft.question;
    }

    throw new DuplicatePlacardError(
      'Could not draft a non-duplicate opinion after ' + attempts + ' attempts',
    );
  }

  private async generateDraft(
    trend: OpinionTrendCandidate | null,
    dedupeContext: DedupeContext,
    rejectedQuestion: string | null,
  ): Promise<OpinionPlacardDraft> {
    const keyInfo = getApikeyInfoFromCount(this.runCount);
    const apiKey = keyInfo.key ?? env.GEMINI_FREE_API_KEY ?? env.GEMINI_PAID_API_KEY;
    const persona = pickOpinionPlacardPersona(this.runCount, this.country.personaLocale);

    if (!apiKey) {
      throw new Error('No Gemini API key configured for opinion placard generation');
    }

    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: this.buildDraftPrompt(
        trend,
        persona.fullName,
        persona.photoDescriptor,
        dedupeContext,
        rejectedQuestion,
      ),
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            authorName: { type: 'string' },
            question: { type: 'string' },
            category: { type: 'string', enum: OPINION_PLACARD_CATEGORIES },
            timestamp: { type: 'string' },
            verified: { type: 'boolean' },
            agreeVotes: { type: 'number' },
            disagreeVotes: { type: 'number' },
            profileImagePrompt: { type: 'string' },
            backgroundVideoQuery: { type: 'string' },
          },
          required: [
            'authorName',
            'question',
            'category',
            'timestamp',
            'verified',
            'agreeVotes',
            'disagreeVotes',
            'profileImagePrompt',
            'backgroundVideoQuery',
          ],
        },
        temperature: 0.95,
      },
    });

    const parsed = JSON.parse(response.text as string) as OpinionPlacardDraft;
    const normalizedCategory = OPINION_PLACARD_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : this.category;
    const category = trend?.inferredCategory ?? normalizedCategory;

    return {
      authorName: persona.fullName,
      question:
        this.normalizeOpinionCaption(cleanText(parsed.question)) ||
        'Man United are not carrying this league, the pressure is too much lol',
      category,
      timestamp: cleanText(parsed.timestamp) || '2 hours ago',
      verified: true,
      agreeVotes: this.normalizeVoteCount(parsed.agreeVotes, 800, 85000),
      disagreeVotes: this.normalizeVoteCount(parsed.disagreeVotes, 500, 65000),
      backgroundVideoQuery:
        cleanText(parsed.backgroundVideoQuery) || this.country.name + ' city street',
      profileImagePrompt:
        cleanText(parsed.profileImagePrompt) ||
        `Realistic social media profile photo of ${persona.fullName}, ${persona.photoDescriptor}, natural light, square crop`,
    };
  }

  private buildDraftPrompt(
    trend: OpinionTrendCandidate | null,
    authorName: string,
    photoDescriptor: string,
    dedupeContext: DedupeContext,
    rejectedQuestion: string | null,
  ): string {
    const openers = dedupeContext.recentOpeners.slice(0, 12);
    const varietyInstruction = openers.length
      ? 'Do not start with any of these recently used openings: ' + openers.join('; ') + '.'
      : '';
    const retryInstruction = rejectedQuestion
      ? 'This draft was rejected as a repeat, so take a clearly different angle: "' +
        rejectedQuestion +
        '"'
      : '';
    const trendInstruction = trend
      ? `
Google trend to base the opinion on:
- title: ${trend.title}
- mapped category: ${trend.inferredCategory}
- source: ${trend.source}
- context: ${trend.trendContext}

The question must be inspired by this trend, but it should still read like a normal person asking friends for opinions. Do not write a news headline.`
      : `
No Google trend candidate was available. Create a timely evergreen opinion for ${this.category}.`;

    return `
Create one realistic Scapu Opinion Bar placard draft for the category: ${this.category}.
${trendInstruction}

The person posting is from ${this.country.name}. Write in their voice:
- Reference local context, teams, shows, or slang only where it fits naturally.
- Use everyday ${this.country.name} English. Do not caricature or overdo slang.
- The take must make sense to someone scrolling in ${this.country.name}.

The output should feel like a real person posted it, not a brand, journalist, or AI account.
${varietyInstruction}
${retryInstruction}

Rules:
- authorName: use exactly "${authorName}".
- question: one punchy social caption or hot take, 8-22 words, direct, debatable, and easy to vote on.
- It should sound like a real person starting gist in a group chat, not a survey writer.
- It can be funny, petty, skeptical, dramatic, or mildly provocative, but not cruel.
- It may include 1-3 common emojis when they fit the tone.
- Never use flag emojis; they do not render in the placard font.
- It does not have to end with a question mark.
- Prefer caption-style takes like "Man United would never carry the cup in this league, they just can't" over generic polls like "Who will win the league?"
- category: exactly one of ${OPINION_PLACARD_CATEGORIES.join(', ')}. Prefer the mapped category when a trend is supplied.
- timestamp: short relative time like "18 min ago", "2 hours ago", or "1 day ago".
- verified: always true.
- agreeVotes and disagreeVotes: realistic numbers between 500 and 85000. Avoid perfect splits.
- profileImagePrompt: realistic square profile photo prompt for ${photoDescriptor}. No celebrity names, no logos, no text.
- backgroundVideoQuery: 2 to 4 words naming stock footage that suits the topic, used to search a stock video library.
  Describe a place, scene, or activity such as "lagos street traffic", "stadium crowd night", "trading floor screens".
  Prefer scenery, cities, crowds, or abstract motion. Avoid close-up faces, named people, brands, and logos.

Avoid hate, slurs, harassment, sexual content, graphic violence, medical advice, direct insults at private people, and claims that require breaking news accuracy.
Make the opinion specific enough to feel human, but not dependent on today's live news.

Return only valid JSON.`;
  }

  private async generateAvatar(
    draft: OpinionPlacardDraft,
    outputDir: string,
    slug: string,
  ): Promise<string | null> {
    try {
      const fetched = await this.avatarService.fetchAvatar({
        ethnicity: this.country.avatarEthnicity,
        photoDescriptor: draft.profileImagePrompt,
        seed: this.runCount,
      });

      if (!fetched) {
        logger.warn('No avatar provider succeeded; placard will use initials avatar');
        return null;
      }

      this.avatarProvider = fetched.provider;

      const avatarPath = path.join(outputDir, `${slug}-avatar.png`);
      const avatarBuffer = await this.buildCircularAvatar(fetched.buffer);

      await fs.promises.writeFile(avatarPath, avatarBuffer);

      return avatarPath;
    } catch (error) {
      logger.error({ error }, 'Profile image fetch failed; placard will use initials avatar');
      return null;
    }
  }

  private async buildCircularAvatar(imageBuffer: Buffer): Promise<Buffer> {
    const size = 84;
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
    );

    return sharp(imageBuffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  private async ensureOutputDir(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10);
    const outputDir = path.join(this.outputRoot, date);
    await fs.promises.mkdir(outputDir, { recursive: true });
    return outputDir;
  }

  private buildSlug(draft: OpinionPlacardDraft): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const category = draft.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `placard-${stamp}-${category}`;
  }

  private normalizeVoteCount(value: number, min: number, max: number): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return min;
    }

    return Math.max(min, Math.min(max, Math.round(parsed)));
  }

  private normalizeOpinionCaption(value: string): string {
    if (!value) {
      return '';
    }

    const withoutFlags = this.stripFlagEmojis(value);

    return withoutFlags.length > 150 ? withoutFlags.slice(0, 147).trim() : withoutFlags;
  }

  /**
   * Flag emojis are pairs of regional indicator symbols. The placard font has no
   * glyph for them, so they render as stray capitals such as "NG".
   */
  private stripFlagEmojis(value: string): string {
    const withoutFlags = [...value]
      .filter(character => {
        const codePoint = character.codePointAt(0) ?? 0;

        return codePoint < 0x1f1e6 || codePoint > 0x1f1ff;
      })
      .join('');

    return withoutFlags.replace(/  +/g, ' ').trim();
  }
}
