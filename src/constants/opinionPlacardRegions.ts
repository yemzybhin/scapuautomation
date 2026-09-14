import { OpinionPlacardCategory } from './opinionPlacard';

export enum PlacardRegion {
  NIGERIA = 'nigeria',
  UNITED_STATES = 'united_states',
  WORLD = 'world',
}

/** Ethnicity hint passed to avatar providers that support filtering. */
export type AvatarEthnicity = 'african' | 'european' | 'latino' | 'asian';

export type PlacardCountry = {
  /** ISO code used for the Google Trends `geo` parameter. */
  code: string;
  name: string;
  /** Shown large on the video so viewers can tell where the take comes from. */
  hashtag: string;
  /** Matches `locale` on a persona pool in opinionPlacardPersonas.ts. */
  personaLocale: string;
  avatarEthnicity: AvatarEthnicity;
  /** Google News RSS localisation. */
  news: { hl: string; gl: string; ceid: string };
  /** Search phrases blended into the Google News fallback queries. */
  localQueries: string[];
  /** Categories that read naturally for this audience. */
  categories: OpinionPlacardCategory[];
};

const GLOBAL_CATEGORIES: OpinionPlacardCategory[] = [
  OpinionPlacardCategory.BUSINESS,
  OpinionPlacardCategory.HEALTH,
  OpinionPlacardCategory.ENTERTAINMENT,
  OpinionPlacardCategory.SCIENCE,
  OpinionPlacardCategory.TECHNOLOGY,
  OpinionPlacardCategory.SPORTS,
  OpinionPlacardCategory.MUSIC,
  OpinionPlacardCategory.POLITICS,
  OpinionPlacardCategory.POP_CULTURE,
  OpinionPlacardCategory.FOOTBALL,
  OpinionPlacardCategory.RELIGION,
];

export const NIGERIA: PlacardCountry = {
  code: 'NG',
  name: 'Nigeria',
  hashtag: '#Nigeria',
  personaLocale: 'Nigerian',
  avatarEthnicity: 'african',
  news: { hl: 'en-NG', gl: 'NG', ceid: 'NG:en' },
  localQueries: [
    'Nigeria trending when:7d',
    'Naija music Afrobeats when:7d',
    'Nigeria Super Eagles NPFL when:7d',
    'Nollywood trending when:7d',
    'Nigeria politics debate when:7d',
    'Lagos trending when:7d',
  ],
  // American football has no local audience here.
  categories: GLOBAL_CATEGORIES,
};

export const UNITED_STATES: PlacardCountry = {
  code: 'US',
  name: 'the United States',
  hashtag: '#UnitedStates',
  personaLocale: 'American',
  avatarEthnicity: 'european',
  news: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  localQueries: [
    'NFL trending when:7d',
    'NBA trending when:7d',
    'US politics debate when:7d',
    'Hollywood trending when:7d',
    'tech trending when:7d',
  ],
  categories: [...GLOBAL_CATEGORIES, OpinionPlacardCategory.AMERICAN_FOOTBALL],
};

/** Rotated through for the "rest of the world" slots so it never sticks to one country. */
export const WORLD_COUNTRIES: PlacardCountry[] = [
  {
    code: 'GB',
    name: 'the United Kingdom',
    hashtag: '#UnitedKingdom',
    personaLocale: 'British',
    avatarEthnicity: 'european',
    news: { hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
    localQueries: ['UK trending when:7d', 'Premier League when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'ZA',
    name: 'South Africa',
    hashtag: '#SouthAfrica',
    personaLocale: 'South African',
    avatarEthnicity: 'african',
    news: { hl: 'en-ZA', gl: 'ZA', ceid: 'ZA:en' },
    localQueries: ['South Africa trending when:7d', 'Amapiano when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'IN',
    name: 'India',
    hashtag: '#India',
    personaLocale: 'Indian',
    avatarEthnicity: 'asian',
    news: { hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
    localQueries: ['India trending when:7d', 'Bollywood cricket when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'BR',
    name: 'Brazil',
    hashtag: '#Brazil',
    personaLocale: 'Brazilian',
    avatarEthnicity: 'latino',
    news: { hl: 'en-US', gl: 'BR', ceid: 'BR:en' },
    localQueries: ['Brazil trending when:7d', 'Brasileirao when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'MX',
    name: 'Mexico',
    hashtag: '#Mexico',
    personaLocale: 'Mexican',
    avatarEthnicity: 'latino',
    news: { hl: 'en-US', gl: 'MX', ceid: 'MX:en' },
    localQueries: ['Mexico trending when:7d', 'Liga MX when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'FR',
    name: 'France',
    hashtag: '#France',
    personaLocale: 'French',
    avatarEthnicity: 'european',
    news: { hl: 'en-US', gl: 'FR', ceid: 'FR:en' },
    localQueries: ['France trending when:7d', 'Ligue 1 when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'JP',
    name: 'Japan',
    hashtag: '#Japan',
    personaLocale: 'Japanese',
    avatarEthnicity: 'asian',
    news: { hl: 'en-US', gl: 'JP', ceid: 'JP:en' },
    localQueries: ['Japan trending when:7d', 'anime trending when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
  {
    code: 'CN',
    name: 'China',
    hashtag: '#China',
    personaLocale: 'Chinese',
    avatarEthnicity: 'asian',
    news: { hl: 'en-US', gl: 'SG', ceid: 'SG:en' },
    localQueries: ['China tech trending when:7d'],
    categories: GLOBAL_CATEGORIES,
  },
];

/**
 * A fixed ten-slot rotation rather than a weighted random draw: random picking
 * clumps (six US placards in a row is a normal random outcome), while this
 * guarantees an exact 50/30/20 split across every ten runs.
 */
export const REGION_ROTATION: PlacardRegion[] = [
  PlacardRegion.NIGERIA,
  PlacardRegion.UNITED_STATES,
  PlacardRegion.NIGERIA,
  PlacardRegion.WORLD,
  PlacardRegion.UNITED_STATES,
  PlacardRegion.NIGERIA,
  PlacardRegion.UNITED_STATES,
  PlacardRegion.NIGERIA,
  PlacardRegion.UNITED_STATES,
  PlacardRegion.NIGERIA,
  PlacardRegion.UNITED_STATES,
];

export const pickRegionForRun = (runCount: number): PlacardRegion =>
  REGION_ROTATION[Math.abs(runCount) % REGION_ROTATION.length];

export const resolveCountry = (region: PlacardRegion, runCount: number): PlacardCountry => {
  if (region === PlacardRegion.NIGERIA) {
    return NIGERIA;
  }

  if (region === PlacardRegion.UNITED_STATES) {
    return UNITED_STATES;
  }

  // Spread the world slots evenly: every tenth run lands here, so divide first.
  const worldSlot = Math.floor(Math.abs(runCount) / REGION_ROTATION.length);

  return WORLD_COUNTRIES[worldSlot % WORLD_COUNTRIES.length];
};

export const pickCategoryForCountry = (
  country: PlacardCountry,
  categoryIndex: number,
): OpinionPlacardCategory =>
  country.categories[Math.abs(categoryIndex) % country.categories.length];
