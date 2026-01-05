import type { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService.js';
import { GameService } from '../services/GameService.js';

export function registerSocketHandlers(io: Server) {
  const socketRoomMap = new Map<string, { code: string; playerId: string }>();
  io.on('connection', (socket: Socket) => {
    socket.on('join_room', ({ code, playerName, sound }) => {
      try {
        const player = RoomService.joinRoom(code, playerName, sound);
        socket.join(code);
        socket.join(player.id); // personal channel
        socketRoomMap.set(socket.id, { code, playerId: player.id });
        // Backend-driven room events
        socket.emit('room:joined', { playerId: player.id, isHost: player.isHost, code });
        io.to(code).emit('room:user_count', { code, count: RoomService.getState(code).players.length });
      } catch (err: any) {
        socket.emit('error', { error: err.message });
      }
    });

    socket.on('start_game', ({ code, starterId }) => {
      try {
        GameService.start(io, code, starterId);
      } catch (err: any) {
        socket.emit('error', { error: err.message });
      }
    });

    socket.on('submit_answer', ({ code, playerId, answerId }) => {
      try {
        GameService.submitAnswer(io, code, playerId, Number(answerId));
      } catch (err: any) {
        socket.emit('error', { error: err.message });
      }
    });

    socket.on('bubble_click', ({ code, playerId, pairId, kind }) => {
      try {
        GameService.handleBubbleClick(io, code, playerId, { pairId: Number(pairId), kind });
      } catch (err: any) {
        socket.emit('error', { error: err.message });
      }
    });

    socket.on('disconnect', () => {
      const meta = socketRoomMap.get(socket.id);
      if (!meta) return;
      const { code, playerId } = meta;
      RoomService.removePlayer(code, playerId);
      socketRoomMap.delete(socket.id);
      io.to(code).emit('room:user_count', { code, count: RoomService.getState(code).players.length });
    });
  });
}
