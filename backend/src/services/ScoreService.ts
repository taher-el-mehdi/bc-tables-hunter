import { env } from '../config/env';
import { DifficultyMap, type Rarity } from '../config/constants';
import type { Player, Question } from '../types/index.js';

function rarityOf(q: Question): Rarity {
  return DifficultyMap[q.difficulty];
}

export const ScoreService = {
  correct(player: Player, q: Question) {
    const rarity = rarityOf(q);
    const gain = env.POINTS[rarity] ?? 10;
    player.score += gain + (player.streak > 0 ? env.STREAK_BONUS : 0);
    player.streak += 1;
  },
  wrong(player: Player) {
    player.score += env.WRONG_PENALTY;
    player.streak = 0;
  }
};
