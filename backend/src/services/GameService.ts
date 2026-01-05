import { RoomService } from './RoomService.js';
import { getQuestion } from './QuestionService.js';
import { ScoreService } from './ScoreService.js';
import type { Server } from 'socket.io';
import type { Player, RoomState } from '../types/index.js';
import { env } from '../config/env.js';

// Simple match-game configuration
const MAX_PAIRS_PER_ROOM = 8;

// Per-room player selections: store first pick awaiting a match
const pendingSelections = new Map<string, Map<string, { pairId: number; kind: 'id' | 'name' }>>();

export const GameService = {
  start(io: Server, code: string, starterId: string) {
    const room = RoomService.getRoom(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    if (room.hostId !== starterId) throw Object.assign(new Error('Only host can start'), { status: 403 });
    RoomService.setStatus(code, 'in-progress');
    // Initialize pairs for the room (shared bubble list)
    const pairs = this.generatePairs(MAX_PAIRS_PER_ROOM);
    RoomService.setPairs(code, pairs);
    // Reset selections
    pendingSelections.set(code, new Map());
    // Broadcast initial room state including leaderboard
    io.to(code).emit('room_state', {
      code,
      pairs,
      players: this.leaderboard(room),
    });
  },

  // Original quiz flow retained but not used by match game
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

  handleBubbleClick(io: Server, code: string, playerId: string, payload: { pairId: number; kind: 'id' | 'name' }) {
    const room = RoomService.getRoom(code);
    if (!room || !room.pairs) return;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    const pair = room.pairs.find(p => p.id === payload.pairId);
    if (!pair || pair.matched) return; // ignore matched pairs

    const map = pendingSelections.get(code) ?? new Map<string, { pairId: number; kind: 'id' | 'name' }>();
    pendingSelections.set(code, map);

    const prev = map.get(playerId);
    if (!prev) {
      map.set(playerId, payload);
      io.to(code).emit('selection_update', { playerId, selection: payload });
      return;
    }

    // If same bubble clicked twice, clear selection
    if (prev.pairId === payload.pairId && prev.kind === payload.kind) {
      map.delete(playerId);
      io.to(code).emit('selection_update', { playerId, selection: null });
      return;
    }

    // Check for match: same pairId, opposite kinds
    const isMatch = prev.pairId === payload.pairId && prev.kind !== payload.kind;
    map.delete(playerId);

    if (isMatch) {
      pair.matched = true;
      // scoring: +10 points, streak+1, matches+1
      player.score += 10 + (player.streak > 0 ? env.STREAK_BONUS : 0);
      player.streak += 1;
      player.matches = (player.matches ?? 0) + 1;
      io.to(code).emit('pair_matched', { playerId, pairId: pair.id });
      io.to(code).emit('leaderboard_update', { players: this.leaderboard(room) });

      // If all matched, finish
      const allDone = room.pairs.every(p => p.matched);
      if (allDone) this.finish(io, code);
    } else {
      // wrong guess: penalty and reset streak
      player.score += env.WRONG_PENALTY;
      player.streak = 0;
      player.wrong = (player.wrong ?? 0) + 1;
      io.to(code).emit('selection_update', { playerId, selection: null });
      io.to(code).emit('leaderboard_update', { players: this.leaderboard(room) });
    }
    // broadcast score updated for the player
    io.to(code).emit('score_updated', { playerId: player.id, score: player.score, streak: player.streak });
  },

  generatePairs(count: number): NonNullable<RoomState['pairs']> {
    // Build pairs from questions service pool
    const uniq = new Set<number>();
    const res: NonNullable<RoomState['pairs']> = [];
    while (res.length < count) {
      const q = getQuestion();
      if (uniq.has(q.id)) continue;
      uniq.add(q.id);
      res.push({ id: q.id, name: q.name, matched: false });
    }
    return res;
  },

  leaderboard(room: RoomState) {
    return [...room.players]
      .map(p => ({ id: p.id, name: p.name, score: p.score, matches: p.matches ?? 0, wrong: p.wrong ?? 0 }))
      .sort((a, b) => b.matches - a.matches || b.score - a.score);
  },
};
