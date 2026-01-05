import Phaser from 'phaser';
import { RealtimeClient } from '../services/RealtimeClient';
import { BackendConfig } from '../config/backend';

export default class MenuScene extends Phaser.Scene {
  private client = RealtimeClient.getInstance();
  private playerId: string | null = null;
  private isHost: boolean = false;
  private roomCode: string | null = null;
  private usersCountText?: Phaser.GameObjects.Text;
  private nameFieldText?: Phaser.GameObjects.Text;
  private roomFieldText?: Phaser.GameObjects.Text;
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    const title = this.add.text(width / 2, height / 2 - 120, 'BC Tables Hunter', {
      fontFamily: 'Orbitron',
      fontSize: '32px',
      color: '#93c5fd',
    }).setOrigin(0.5);
    // Simple lobby form using text elements + prompts for input
    this.nameFieldText = this.add.text(width / 2, height / 2 - 40, 'Enter name', {
      fontFamily: 'Orbitron', fontSize: '20px', color: '#e2e8f0', backgroundColor: '#1e293b'
    }).setOrigin(0.5).setPadding(10, 6, 10, 6).setInteractive({ useHandCursor: true });
    this.roomFieldText = this.add.text(width / 2, height / 2 + 10, 'Enter room', {
      fontFamily: 'Orbitron', fontSize: '20px', color: '#e2e8f0', backgroundColor: '#1e293b'
    }).setOrigin(0.5).setPadding(10, 6, 10, 6).setInteractive({ useHandCursor: true });
    const joinBtn = this.add.text(width / 2, height / 2 + 60, 'Join Room', {
      fontFamily: 'Orbitron', fontSize: '22px', color: '#fef3c7', backgroundColor: '#334155'
    }).setOrigin(0.5).setPadding(12, 8, 12, 8).setInteractive({ useHandCursor: true });

    let name = localStorage.getItem('playerName') || '';
    let code = localStorage.getItem('roomCode') || '';
    if (name) this.nameFieldText.setText(`Name: ${name}`);
    if (code) this.roomFieldText.setText(`Room: ${code}`);
    this.nameFieldText.on('pointerup', () => {
      const v = window.prompt('Enter your name', name || undefined)?.trim();
      if (v) { name = v; this.nameFieldText!.setText(`Name: ${name}`); }
    });
    this.roomFieldText.on('pointerup', () => {
      const v = window.prompt('Enter room code', code || undefined)?.trim();
      if (v) { code = v.toUpperCase(); this.roomFieldText!.setText(`Room: ${code}`); }
    });
    joinBtn.on('pointerup', () => {
      if (!name || !code) {
        this.add.text(width / 2, height / 2 + 110, 'Please enter name and room', { fontFamily: 'Orbitron', fontSize: '16px', color: '#fca5a5' }).setOrigin(0.5);
        return;
      }
      this.roomCode = code;
      // Persist to localStorage
      try {
        localStorage.setItem('playerName', name);
        localStorage.setItem('roomCode', code);
      } catch {}
      this.client.onStandard('room:joined', ({ playerId, isHost }) => {
        this.playerId = playerId;
        this.isHost = !!isHost;
        if (!this.usersCountText) this.usersCountText = this.add.text(width / 2, height / 2 + 140, '', { fontFamily: 'Orbitron', fontSize: '18px', color: '#a7f3d0' }).setOrigin(0.5);
      });
      this.client.onStandard('room:user_count', ({ count }) => {
        if (!this.usersCountText) return;
        this.usersCountText.setText(`Users connected in this room: ${count}`);
      });
      this.client.joinRoom(code, name);

      // Fallback: query room state for initial count
      (async () => {
        try {
          const resp = await fetch(`${BackendConfig.apiUrl}/rooms/${code}/state`);
          const data = await resp.json();
          const count = Array.isArray(data?.players) ? data.players.length : undefined;
          if (typeof count === 'number') {
            if (!this.usersCountText) this.usersCountText = this.add.text(width / 2, height / 2 + 140, '', { fontFamily: 'Orbitron', fontSize: '18px', color: '#a7f3d0' }).setOrigin(0.5);
            this.usersCountText.setText(`Users connected in this room: ${count}`);
          }
        } catch {}
      })();
    });

    // Host can start game
    const playBtn = this.add.text(width - 120, height - 48, 'Start', {
      fontFamily: 'Orbitron', fontSize: '18px', color: '#d9f99d', backgroundColor: '#1e293b'
    }).setOrigin(0.5).setPadding(10, 6, 10, 6).setInteractive({ useHandCursor: true });
    playBtn.on('pointerup', () => {
      if (this.roomCode && this.playerId && this.isHost) {
        this.client.startGame(this.roomCode, this.playerId);
        this.scene.start('GameScene', { roomCode: this.roomCode, playerId: this.playerId });
      }
    });
  }
}
