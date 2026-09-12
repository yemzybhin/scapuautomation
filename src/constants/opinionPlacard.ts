export enum OpinionPlacardCategory {
  BUSINESS = 'Business',
  HEALTH = 'Health',
  ENTERTAINMENT = 'Entertainment',
  SCIENCE = 'Science',
  TECHNOLOGY = 'Technology',
  SPORTS = 'Sports',
  MUSIC = 'Music',
  POLITICS = 'Politics',
  POP_CULTURE = 'Pop Culture',
  FOOTBALL = 'Football',
  AMERICAN_FOOTBALL = 'American Football',
  RELIGION = 'Religion',
}

export const OPINION_PLACARD_CATEGORIES: OpinionPlacardCategory[] =
  Object.values(OpinionPlacardCategory);

export const OPINION_PLACARD_CATEGORY_COLORS: Record<OpinionPlacardCategory, string> = {
  [OpinionPlacardCategory.BUSINESS]: '#FF9500',
  [OpinionPlacardCategory.HEALTH]: '#4E9B28',
  [OpinionPlacardCategory.ENTERTAINMENT]: '#D13183',
  [OpinionPlacardCategory.SCIENCE]: '#0088A7',
  [OpinionPlacardCategory.TECHNOLOGY]: '#007AFF',
  [OpinionPlacardCategory.SPORTS]: '#FF4500',
  [OpinionPlacardCategory.MUSIC]: '#7252FF',
  [OpinionPlacardCategory.POLITICS]: '#FF3B30',
  [OpinionPlacardCategory.POP_CULTURE]: '#FFB347',
  [OpinionPlacardCategory.FOOTBALL]: '#3EB96B',
  [OpinionPlacardCategory.AMERICAN_FOOTBALL]: '#FF6961',
  [OpinionPlacardCategory.RELIGION]: '#8E5EFF',
};

export const OPINION_PLACARD_CATEGORY_ACCENT_COLORS: Record<OpinionPlacardCategory, string> = {
  [OpinionPlacardCategory.BUSINESS]: '#FFB347',
  [OpinionPlacardCategory.HEALTH]: '#A9CC8D',
  [OpinionPlacardCategory.ENTERTAINMENT]: '#D699C5',
  [OpinionPlacardCategory.SCIENCE]: '#5AB8C3',
  [OpinionPlacardCategory.TECHNOLOGY]: '#8BBDFF',
  [OpinionPlacardCategory.SPORTS]: '#FF8C5B',
  [OpinionPlacardCategory.MUSIC]: '#C5ADF5',
  [OpinionPlacardCategory.POLITICS]: '#F58888',
  [OpinionPlacardCategory.POP_CULTURE]: '#FFD79B',
  [OpinionPlacardCategory.FOOTBALL]: '#9BE6B4',
  [OpinionPlacardCategory.AMERICAN_FOOTBALL]: '#FFC7C7',
  [OpinionPlacardCategory.RELIGION]: '#DEC5FF',
};
