import { env } from '../config/env.js';
import type { Rarity } from '../config/constants.js';
import type { Player, Question } from '../types/index.js';

function rarityOf(q: Question): Rarity {
  const d = q.difficulty as 1 | 2 | 3;
  return d === 1 ? 'common' : d === 2 ? 'rare' : 'legendary';
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
