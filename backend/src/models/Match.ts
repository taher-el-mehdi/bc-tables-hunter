import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  code: { type: String, required: true },
  players: [{ name: String, score: Number }],
  podium: [{ name: String, score: Number }],
  totalRounds: { type: Number, required: true },
}, { timestamps: true });

export const MatchModel = mongoose.model('Match', MatchSchema);
