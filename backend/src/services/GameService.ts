import { RoomService } from './RoomService';
import { getQuestion } from './QuestionService';
import { ScoreService } from './ScoreService';
import type { Server } from 'socket.io';
import type { Player } from '../types/index.js';
import { env } from '../config/env';

export const GameService = {
  start(io: Server, code: string, starterId: string) {
    const room = RoomService.getRoom(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    if (room.hostId !== starterId) throw Object.assign(new Error('Only host can start'), { status: 403 });
    RoomService.setStatus(code, 'in-progress');
    io.to(code).emit('game_started', { code });
    this.nextRound(io, code);
  },

  nextRound(io: Server, code: string) {
    const room = RoomService.getRoom(code);
    if (!room) return;
    const next = room.round + 1;
    if (next > room.totalRounds) return this.finish(io, code);
    RoomService.setRound(code, next);
    const q = getQuestion();
    RoomService.setQuestion(code, q);
    const endsAt = Date.now() + env.ROUND_SECONDS * 1000;
    RoomService.setRoundEnds(code, endsAt);

    io.to(code).emit('new_question', { question: { name: q.name, category: q.category, difficulty: q.difficulty }, endsAt });

    setTimeout(() => {
      // Move to next round even if no answer
      this.nextRound(io, code);
    }, env.ROUND_SECONDS * 1000);
  },

  submitAnswer(io: Server, code: string, playerId: string, answerId: number) {
    const room = RoomService.getRoom(code);
    if (!room || !room.currentQuestion) return;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    const isCorrect = answerId === room.currentQuestion.id;
    if (isCorrect) ScoreService.correct(player, room.currentQuestion);
    else ScoreService.wrong(player);

    io.to(code).emit('score_updated', { playerId: player.id, score: player.score, streak: player.streak });
    io.to(player.id).emit('answer_submitted', { correct: isCorrect });
  },

  finish(io: Server, code: string) {
    const room = RoomService.getRoom(code);
    if (!room) return;
    RoomService.setStatus(code, 'finished');
    RoomService.setRoundEnds(code, undefined);

    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const podium = sorted.slice(0, 3).map(p => ({ id: p.id, name: p.name, score: p.score }));

    io.to(code).emit('match_finished', { podium });

    // TODO: persist analytics and leaderboard if enabled
  },
};
