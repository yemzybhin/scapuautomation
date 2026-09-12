export interface OpinionPlacardVideoProps {
  authorName: string;
  question: string;
  category: string;
  categoryColor: string;
  categoryAccentColor: string;
  timestamp: string;
  verified: boolean;
  agreeVotes: number;
  disagreeVotes: number;
  avatarDataUrl?: string | null;
  backgroundVideoSrc?: string | null;
  backgroundImageSrc?: string | null;
  soundtrackSrc?: string | null;
  soundtrackVolume?: number;
  staticCardOnly?: boolean;
}

export enum VideoTemplate {
  OPINION_PLACARD = 'opinionPlacard',
}
