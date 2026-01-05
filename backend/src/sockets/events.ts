import type { Server, Socket } from 'socket.io';
import { RoomService } from '../services/RoomService.js';
import { GameService } from '../services/GameService.js';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.on('join_room', ({ code, playerName, sound }) => {
      try {
        const player = RoomService.joinRoom(code, playerName, sound);
        socket.join(code);
        socket.join(player.id); // personal channel
        io.to(code).emit('player_joined', { player: { id: player.id, name: player.name, isHost: player.isHost } });
        socket.emit('joined', { playerId: player.id, isHost: player.isHost });
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
      // Optionally handle cleanup
    });
  });
}
