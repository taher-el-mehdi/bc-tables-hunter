import { io, Socket } from 'socket.io-client';
import { BackendConfig } from '../config/backend';

export class RealtimeClient {
  private static _instance: RealtimeClient | null = null;
  private socket: Socket | null = null;

  static getInstance() {
    if (!RealtimeClient._instance) RealtimeClient._instance = new RealtimeClient();
    return RealtimeClient._instance;
  }

  connect() {
    if (this.socket) return this.socket;
    this.socket = io(BackendConfig.wsUrl, { transports: ['websocket'] });
    return this.socket;
  }

  joinRoom(code: string, playerName: string, sound?: { music?: boolean; sfx?: boolean }) {
    this.connect();
    this.socket!.emit('join_room', { code, playerName, sound });
  }

  startGame(code: string, starterId: string) {
    this.connect();
    this.socket!.emit('start_game', { code, starterId });
  }

  submitAnswer(code: string, playerId: string, answerId: number) {
    this.connect();
    this.socket!.emit('submit_answer', { code, playerId, answerId });
  }

  emitBubbleClick(code: string, playerId: string, pairId: number, kind: 'id' | 'name') {
    this.connect();
    this.socket!.emit('bubble_click', { code, playerId, pairId, kind });
  }

  on(event: 'player_joined' | 'joined' | 'game_started' | 'new_question' | 'answer_submitted' | 'score_updated' | 'match_finished' | 'room_state' | 'pair_matched' | 'selection_update' | 'leaderboard_update' | 'error', handler: (payload: any) => void) {
    this.connect();
    this.socket!.on(event, handler);
  }

  off(event: string, handler?: (payload: any) => void) {
    this.socket?.off(event, handler as any);
  }
}
