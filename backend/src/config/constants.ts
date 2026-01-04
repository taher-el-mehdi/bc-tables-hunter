export const DifficultyMap = {
  1: 'common',
  2: 'rare',
  3: 'legendary',
} as const;

export type Rarity = 'common' | 'rare' | 'legendary';
