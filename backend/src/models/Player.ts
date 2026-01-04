import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  streakMax: { type: Number, default: 0 },
}, { timestamps: true });

export const PlayerModel = mongoose.model('Player', PlayerSchema);
