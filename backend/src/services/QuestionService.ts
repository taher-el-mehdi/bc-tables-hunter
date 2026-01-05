import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { DifficultyMap, type Rarity } from '../config/constants.js';
import type { Question } from '../types/index.js';

let questions: Question[] = [];

export function loadQuestions() {
  const file = path.join(process.cwd(), 'src', 'data', 'tables.json');
  const raw = fs.readFileSync(file, 'utf8');
  questions = JSON.parse(raw) as Question[];
}

function pickRarity(): Rarity {
  const weights = env.RARITY_WEIGHTS;
  const entries = Object.entries(weights) as [Rarity, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [rarity, w] of entries) {
    if (r < w) return rarity;
    r -= w;
  }
  return 'common';
}

export function getQuestion(): Question {
  if (questions.length === 0) loadQuestions();
  const rarity = pickRarity();
  const diff = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : 3;
  const pool = questions.filter(q => q.difficulty === diff);
  const source = pool.length ? pool : questions; // fallback if no diff 3
  return source[Math.floor(Math.random() * source.length)];
}
