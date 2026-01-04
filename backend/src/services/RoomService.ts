import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import type { RoomState, Player } from '../types/index.js';

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

    const player: Player = { id: uuidv4(), name, score: 0, streak: 0, isHost: false, sound };
    room.players.push(player);

    if (!room.hostId) {
      room.hostId = player.id;
      player.isHost = true;
    }

    return player;
  },

  getState(code: string): RoomState {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    return room;
  },

  setStatus(code: string, status: RoomState['status']) {
    const room = rooms.get(code);
    if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
    room.status = status;
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
};
