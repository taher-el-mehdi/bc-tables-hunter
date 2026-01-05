import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { RoomService } from '../services/RoomService.js';
import { GameService } from '../services/GameService.js';

export function RoomsController(io: Server) {
  return {
    createRoom: (req: Request, res: Response) => {
      const { maxPlayers } = req.body;
      const room = RoomService.createRoom(maxPlayers);
      res.status(201).json({ code: room.code, maxPlayers: room.maxPlayers });
    },

    joinRoom: (req: Request, res: Response) => {
      const { code } = req.params;
      const { playerName, sound } = req.body;
      const player = RoomService.joinRoom(code, playerName, sound);
      // join socket room
      io.socketsJoin?.(code); // best effort if available in REST context
      io.to(code).emit('player_joined', { player: { id: player.id, name: player.name, isHost: player.isHost } });
      res.status(200).json({ playerId: player.id, isHost: player.isHost });
    },

    startRoom: (req: Request, res: Response) => {
      const { code } = req.params;
      const { starterId } = req.body ?? {};
      try {
        GameService.start(io, code, starterId);
        res.status(200).json({ started: true });
      } catch (err: any) {
        res.status(err.status || 400).json({ error: err.message });
      }
    },

    getRoomState: (req: Request, res: Response) => {
      const { code } = req.params;
      try {
        const room = RoomService.getState(code);
        res.status(200).json(room);
      } catch (err: any) {
        res.status(err.status || 404).json({ error: err.message });
      }
    },
  };
}
