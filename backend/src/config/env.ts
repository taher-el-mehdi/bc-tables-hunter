import dotenv from 'dotenv';
dotenv.config();

function parseJSON<T>(val: string | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

export const env = {
  PORT: Number(process.env.PORT ?? 8080),
  HOST: process.env.HOST ?? '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  MAX_PLAYERS: Number(process.env.MAX_PLAYERS ?? 6),
  ROUND_SECONDS: Number(process.env.ROUND_SECONDS ?? 15),
  TOTAL_ROUNDS: Number(process.env.TOTAL_ROUNDS ?? 10),
  RARITY_WEIGHTS: parseJSON<Record<string, number>>(process.env.RARITY_WEIGHTS, { common: 70, rare: 25, legendary: 5 }),
  POINTS: parseJSON<Record<string, number>>(process.env.POINTS, { common: 10, rare: 25, legendary: 50 }),
  WRONG_PENALTY: Number(process.env.WRONG_PENALTY ?? -10),
  STREAK_BONUS: Number(process.env.STREAK_BONUS ?? 5),
  MONGO_URL: process.env.MONGO_URL,
  PERSIST_ENABLED: (process.env.PERSIST_ENABLED ?? 'false').toLowerCase() === 'true',
  ADMIN_USER: process.env.ADMIN_USER ?? 'admin',
  ADMIN_PASS: process.env.ADMIN_PASS ?? 'admin',
};
