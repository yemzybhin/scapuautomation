import axios from 'axios';

import { OPINION_PLACARD_CATEGORIES, OpinionPlacardCategory } from '@/constants/opinionPlacard';
import { PlacardCountry, UNITED_STATES } from '@/constants/opinionPlacardRegions';
import { logger } from '@/middleware/pino-logger';

export interface OpinionTrendCandidate {
  source: 'google_trends' | 'google_news';
  title: string;
  query: string;
  sourceUrl?: string;
  publishedAt?: Date;
  detectedAt: Date;
  relatedQueries: string[];
  articleTitles: string[];
  summary: string;
  trendContext: string;
  recencyScore: number;
  inferredCategory: OpinionPlacardCategory;
}

const categoryKeywords: Record<OpinionPlacardCategory, string[]> = {
  [OpinionPlacardCategory.BUSINESS]: [
    'stock',
    'market',
    'company',
    'startup',
    'economy',
    'inflation',
    'bank',
    'earnings',
    'ceo',
    'layoffs',
    'tariff',
  ],
  [OpinionPlacardCategory.HEALTH]: [
    'health',
    'medical',
    'medicine',
    'doctor',
    'hospital',
    'vaccine',
    'disease',
    'fitness',
    'nutrition',
    'mental health',
    'wellness',
  ],
  [OpinionPlacardCategory.ENTERTAINMENT]: [
    'movie',
    'film',
    'netflix',
    'disney',
    'actor',
    'actress',
    'celebrity',
    'show',
    'trailer',
    'streaming',
    'hollywood',
  ],
  [OpinionPlacardCategory.SCIENCE]: [
    'science',
    'scientist',
    'research',
    'study',
    'nasa',
    'space',
    'climate',
    'discovery',
    'physics',
    'biology',
    'chemistry',
  ],
  [OpinionPlacardCategory.TECHNOLOGY]: [
    'ai',
    'artificial intelligence',
    'apple',
    'google',
    'microsoft',
    'tesla',
    'iphone',
    'android',
    'chip',
    'robot',
    'cybersecurity',
    'app',
  ],
  [OpinionPlacardCategory.SPORTS]: [
    'nba',
    'mlb',
    'tennis',
    'ufc',
    'boxing',
    'olympics',
    'match',
    'coach',
    'player',
    'basketball',
    'baseball',
    'cricket',
  ],
  [OpinionPlacardCategory.MUSIC]: [
    'music',
    'album',
    'song',
    'tour',
    'concert',
    'spotify',
    'grammy',
    'rapper',
    'singer',
    'billboard',
  ],
  [OpinionPlacardCategory.POLITICS]: [
    'election',
    'president',
    'senate',
    'congress',
    'government',
    'minister',
    'policy',
    'campaign',
    'vote',
    'court',
  ],
  [OpinionPlacardCategory.POP_CULTURE]: [
    'viral',
    'tiktok',
    'influencer',
    'meme',
    'celebrity',
    'fashion',
    'trend',
    'social media',
  ],
  [OpinionPlacardCategory.FOOTBALL]: [
    'football',
    'soccer',
    'world cup',
    'champions league',
    'premier league',
    'laliga',
    'fifa',
    'uefa',
    'transfer',
  ],
  [OpinionPlacardCategory.AMERICAN_FOOTBALL]: [
    'nfl',
    'super bowl',
    'quarterback',
    'touchdown',
    'college football',
    'nfl draft',
    'nfl playoffs',
  ],
  [OpinionPlacardCategory.RELIGION]: [
    'religion',
    'church',
    'mosque',
    'faith',
    'christian',
    'islam',
    'muslim',
    'prayer',
    'pope',
    'pastor',
  ],
};

const sensitiveKeywords = [
  'shooting',
  'murder',
  'killed',
  'death toll',
  'rape',
  'abuse',
  'suicide',
  'terror',
  'war',
  'genocide',
];

export class OpinionTrendDiscoveryService {
  private readonly googleTrendsRssUrl = 'https://trends.google.com/trending/rss';
  private readonly googleNewsSearchUrl = 'https://news.google.com/rss/search';
  private readonly fallbackQueries = [
    'sports trending when:7d',
    'football soccer trending when:7d',
    'NFL trending when:7d',
    'entertainment trending when:7d',
    'music trending when:7d',
    'technology trending when:7d',
    'business trending when:7d',
    'health wellness trending when:7d',
    'science discovery trending when:7d',
    'politics debate when:7d',
    'pop culture trending when:7d',
    'religion faith debate when:7d',
  ];

  public async getRecentOpinionTrends(
    country: PlacardCountry = UNITED_STATES,
  ): Promise<OpinionTrendCandidate[]> {
    const [trendCandidates, newsCandidates] = await Promise.all([
      this.fetchGoogleTrendCandidates(country),
      this.fetchGoogleNewsCandidates(country),
    ]);

    return this.dedupeCandidates([...trendCandidates, ...newsCandidates])
      .filter(candidate => candidate.recencyScore > 0)
      .filter(candidate => !this.hasSensitiveKeyword(candidate))
      .sort((a, b) => this.getCandidateScore(b) - this.getCandidateScore(a))
      .slice(0, 50);
  }

  public pickCandidateForCategory(
    candidates: OpinionTrendCandidate[],
    category: OpinionPlacardCategory,
    offset: number,
  ): OpinionTrendCandidate | null {
    const categoryCandidates = candidates.filter(
      candidate => candidate.inferredCategory === category,
    );
    const pool = categoryCandidates.length > 0 ? categoryCandidates : candidates;

    if (pool.length === 0) {
      return null;
    }

    return pool[offset % pool.length];
  }

  private async fetchGoogleTrendCandidates(
    country: PlacardCountry,
  ): Promise<OpinionTrendCandidate[]> {
    try {
      const response = await axios.get<string>(this.googleTrendsRssUrl, {
        responseType: 'text',
        timeout: 15000,
        params: { geo: country.code, hl: country.news.hl },
        headers: this.headers,
      });

      return this.parseRss(response.data).map(item =>
        this.toCandidate(item, 'google_trends', item.title),
      );
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Google Trends RSS for opinion placards');
      return [];
    }
  }

  private async fetchGoogleNewsCandidates(
    country: PlacardCountry,
  ): Promise<OpinionTrendCandidate[]> {
    // Local phrases first so regional placards are not driven by US headlines.
    const queries = [...country.localQueries, ...this.fallbackQueries];
    const results = await Promise.all(
      queries.map(async query => {
        try {
          const response = await axios.get<string>(this.googleNewsSearchUrl, {
            responseType: 'text',
            timeout: 15000,
            params: {
              q: query,
              hl: country.news.hl,
              gl: country.news.gl,
              ceid: country.news.ceid,
            },
            headers: this.headers,
          });

          return this.parseRss(response.data).map(item =>
            this.toCandidate(item, 'google_news', query),
          );
        } catch (error) {
          logger.error({ error, query }, 'Failed to fetch Google News RSS for opinion placards');
          return [];
        }
      }),
    );

    return results.flat();
  }

  private parseRss(xml: string): RssTrendItem[] {
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    return items.map(item => ({
      title: this.decodeXml(this.getTagValue(item, 'title')),
      link: this.decodeXml(this.getTagValue(item, 'link')),
      pubDate: this.decodeXml(this.getTagValue(item, 'pubDate')),
      description: this.cleanDescription(this.getTagValue(item, 'description')),
      relatedQueries: this.getNewsTitles(item),
    }));
  }

  private toCandidate(
    item: RssTrendItem,
    source: OpinionTrendCandidate['source'],
    query: string,
  ): OpinionTrendCandidate {
    const publishedAt = item.pubDate ? new Date(item.pubDate) : undefined;
    const title = this.cleanNewsTitle(item.title);
    const articleTitles = item.relatedQueries.map(articleTitle =>
      this.cleanNewsTitle(articleTitle),
    );
    const summary = item.description;
    const relatedQueries = [
      ...articleTitles,
      ...summary
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(Boolean),
    ].slice(0, 10);
    const trendContext = this.buildTrendContext(title, articleTitles, summary);
    const haystack = [title, query, trendContext, ...relatedQueries].join(' ').toLowerCase();

    return {
      source,
      title,
      query,
      sourceUrl: item.link,
      publishedAt: Number.isNaN(publishedAt?.getTime()) ? undefined : publishedAt,
      detectedAt: new Date(),
      relatedQueries,
      articleTitles,
      summary,
      trendContext,
      recencyScore: this.getRecencyScore(publishedAt),
      inferredCategory: this.inferCategory(haystack),
    };
  }

  private inferCategory(haystack: string): OpinionPlacardCategory {
    const scores = new Map<OpinionPlacardCategory, number>();

    for (const category of OPINION_PLACARD_CATEGORIES) {
      scores.set(category, this.countKeywordMatches(haystack, categoryKeywords[category]));
    }

    const [bestCategory, bestScore] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];

    if (bestScore > 0) {
      return bestCategory;
    }

    return OpinionPlacardCategory.POP_CULTURE;
  }

  private getCandidateScore(candidate: OpinionTrendCandidate): number {
    const sourceScore = candidate.source === 'google_trends' ? 20 : 0;
    const contextScore = Math.min(
      35,
      candidate.articleTitles.length * 8 + (candidate.summary ? 10 : 0),
    );

    return candidate.recencyScore + contextScore + sourceScore;
  }

  private hasSensitiveKeyword(candidate: OpinionTrendCandidate): boolean {
    const haystack = [candidate.title, candidate.query, candidate.trendContext]
      .join(' ')
      .toLowerCase();
    return sensitiveKeywords.some(keyword => this.hasKeyword(haystack, keyword));
  }

  private countKeywordMatches(haystack: string, keywords: string[]): number {
    return keywords.filter(keyword => this.hasKeyword(haystack, keyword)).length;
  }

  private hasKeyword(haystack: string, keyword: string): boolean {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = keyword.includes(' ')
      ? new RegExp(`\\b${escapedKeyword}\\b`, 'i')
      : new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, 'i');

    return pattern.test(haystack);
  }

  private dedupeCandidates(candidates: OpinionTrendCandidate[]): OpinionTrendCandidate[] {
    const seen = new Set<string>();

    return candidates.filter(candidate => {
      const key = candidate.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private getRecencyScore(publishedAt?: Date): number {
    if (!publishedAt) return 55;

    const ageDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays <= 2) return 100;
    if (ageDays <= 7) return 85;
    if (ageDays <= 30) return 55;

    return 0;
  }

  private getTagValue(xml: string, tag: string): string {
    return xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] ?? '';
  }

  private getNewsTitles(xml: string): string[] {
    return Array.from(xml.matchAll(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/g))
      .map(match => this.decodeXml(match[1]))
      .filter(Boolean);
  }

  private stripTags(input: string): string {
    return input.replace(/<[^>]+>/g, ' ');
  }

  private cleanDescription(input: string): string {
    return this.stripTags(this.decodeXml(input))
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+-\s+[^-]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeXml(input: string): string {
    return input
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanNewsTitle(title: string): string {
    return title.replace(/\s+-\s+[^-]+$/, '').trim();
  }

  private buildTrendContext(title: string, articleTitles: string[], summary: string): string {
    const articleContext = articleTitles.length
      ? `Related article titles: ${articleTitles.join(' | ')}.`
      : '';
    const summaryContext = summary ? `Summary/snippet: ${summary}.` : '';

    return [`Trend title: ${title}.`, articleContext, summaryContext].filter(Boolean).join(' ');
  }

  private get headers(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (compatible; ScapuOpinionPlacardBot/1.0; +https://scapu.app)',
    };
  }
}

interface RssTrendItem {
  title: string;
  link?: string;
  pubDate?: string;
  description: string;
  relatedQueries: string[];
}
