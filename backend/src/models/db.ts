import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDB() {
  if (!env.PERSIST_ENABLED || !env.MONGO_URL) return false;
  await mongoose.connect(env.MONGO_URL);
  return true;
}
