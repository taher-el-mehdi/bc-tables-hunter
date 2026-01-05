import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['lobby', 'in-progress', 'finished'], default: 'lobby' },
  playersCount: { type: Number, default: 0 },
  players: [{ playerId: String, name: String, score: Number, online: Boolean }],
}, { timestamps: true });

export const RoomModel = mongoose.model('Room', RoomSchema);
