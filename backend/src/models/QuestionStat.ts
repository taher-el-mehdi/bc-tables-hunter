import mongoose from 'mongoose';

const QuestionStatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: { type: Number, required: true },
  attempts: { type: Number, default: 0 },
  failures: { type: Number, default: 0 },
  difficulty: { type: Number, default: 1 },
}, { timestamps: true });

export const QuestionStatModel = mongoose.model('QuestionStat', QuestionStatSchema);
