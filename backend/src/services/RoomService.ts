import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import type { RoomState, Player } from '../types/index.js';
import { RoomModel } from '../models/Room.js';

const rooms = new Map<string, RoomState>();

function generateCode() {
  return uuidv4().slice(0, 6).toUpperCase();
}

export const RoomService = {
  createRoom(maxPlayers?: number): RoomState {
    const code = generateCode();
    const room: RoomState = {
      code,
      players: [],
      hostId: undefined,
      maxPlayers: maxPlayers ?? env.MAX_PLAYERS,
      status: 'lobby',
      round: 0,
      totalRounds: env.TOTAL_ROUNDS,
      roundEndsAt: undefined,
      currentQuestion: undefined,
    };
    rooms.set(code, room);
    // Persist initial room if persistence enabled
    this._persist(room);
    return room;
  },

  getRoom(code: string): RoomState | undefined {
    return rooms.get(code);
  },

  joinRoom(code: string, name: string, sound?: Player['sound']): Player {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    if (room.players.length >= room.maxPlayers) throw Object.assign(new Error('Room full'), { status: 400 });
    if (room.status !== 'lobby') throw Object.assign(new Error('Game already started'), { status: 400 });

    const player: Player = { id: uuidv4(), name, score: 0, streak: 0, isHost: false, sound, matches: 0, wrong: 0 };
    room.players.push(player);

    if (!room.hostId) {
      room.hostId = player.id;
      player.isHost = true;
    }
    this._persist(room);
    return player;
  },

  getState(code: string): RoomState {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    return room;
  },

  removePlayer(code: string, playerId: string) {
    const room = rooms.get(code);
    if (!room) return;
    const idx = room.players.findIndex(p => p.id === playerId);
    if (idx >= 0) room.players.splice(idx, 1);
    if (room.hostId === playerId) {
      room.hostId = room.players[0]?.id;
      if (room.players[0]) room.players[0].isHost = true;
    }
    this._persist(room);
  },

  setStatus(code: string, status: RoomState['status']) {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    room.status = status;
    this._persist(room);
  },

  setRound(code: string, round: number) {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    room.round = round;
  },

  setRoundEnds(code: string, when: number | undefined) {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    room.roundEndsAt = when;
  },

  setQuestion(code: string, q: RoomState['currentQuestion']) {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    room.currentQuestion = q;
  },

  setPairs(code: string, pairs: NonNullable<RoomState['pairs']>) {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    room.pairs = pairs;
    this._persist(room);
  },

  // Fire-and-forget persistence of room state
  async _persist(room: RoomState) {
    try {
      if (!env.PERSIST_ENABLED) return;
      const players = room.players.map(p => ({ playerId: p.id, name: p.name, score: p.score, online: true }));
      await RoomModel.updateOne(
        { code: room.code },
        { $set: { code: room.code, status: room.status, playersCount: room.players.length, players } },
        { upsert: true }
      );
    } catch (e) {
      // swallow errors to avoid impacting gameplay
      // console.warn('Persist room failed', e);
    }
  },

  sync(code: string) {
    const room = rooms.get(code);
    if (!room) return;
    // no await; fire-and-forget
    this._persist(room);
  },
};
