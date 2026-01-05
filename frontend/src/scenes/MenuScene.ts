import Phaser from 'phaser';
import { RealtimeClient } from '../services/RealtimeClient';
import { BackendConfig } from '../config/backend';

export default class MenuScene extends Phaser.Scene {
  private client = RealtimeClient.getInstance();
  private playerId: string | null = null;
  private isHost: boolean = false;
  private roomCode: string | null = null;
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    const title = this.add.text(width / 2, height / 2 - 60, 'BC Tables Hunter', {
      fontFamily: 'Orbitron',
      fontSize: '32px',
      color: '#93c5fd',
    }).setOrigin(0.5);

    const playBtn = this.add.text(width / 2, height / 2 + 10, 'Play', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      color: '#fef3c7',
      backgroundColor: '#1e293b'
    }).setOrigin(0.5).setPadding(12, 8, 12, 8).setInteractive({ useHandCursor: true });

    // Ask for player name and room code
    const name = window.prompt('Enter your name') || `Player-${Math.floor(Math.random()*1000)}`;
    const code = window.prompt('Enter room code (or create via backend)') || 'ROOM';
    this.roomCode = code;

    // Join via socket
    this.client.on('joined', ({ playerId, isHost }) => {
      this.playerId = playerId;
      this.isHost = !!isHost;
      const hostText = this.add.text(width / 2, height / 2 + 60, this.isHost ? 'You are host' : 'Waiting for host...', {
        fontFamily: 'Orbitron', fontSize: '18px', color: '#a7f3d0'
      }).setOrigin(0.5);
    });
    this.client.joinRoom(code, name);

    // If room not found, create via REST then join
    this.client.on('error', async ({ error }) => {
      if (String(error).includes('Room not found')) {
        try {
          const resp = await fetch(`${BackendConfig.apiUrl}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maxPlayers: 8 }) });
          const data = await resp.json();
          if (data.code) {
            this.roomCode = data.code;
            this.client.joinRoom(this.roomCode, name);
          }
        } catch (e) {
          console.error('Room creation failed', e);
        }
      }
    });

    playBtn.on('pointerup', () => {
      if (this.roomCode && this.playerId) {
        if (!this.isHost) {
          this.add.text(width / 2, height / 2 + 120, 'Only host can start', { fontFamily: 'Orbitron', fontSize: '16px', color: '#fca5a5' }).setOrigin(0.5);
          return;
        }
        this.client.startGame(this.roomCode, this.playerId);
        this.scene.start('GameScene', { roomCode: this.roomCode, playerId: this.playerId });
      }
    });
  }
}
