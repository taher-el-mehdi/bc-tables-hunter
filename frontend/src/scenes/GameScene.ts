import Phaser from 'phaser';
import { GameplayConfig } from '../config/gameConfig';
import { IdCircle } from '../objects/IdCircle';
import { TableCircle } from '../objects/TableCircle';
import { RealtimeClient } from '../services/RealtimeClient';
import { AudioService } from '../services/AudioService';
import { BackendConfig } from '../config/backend';

interface PairItem { id: number; name: string; matched?: boolean }

export default class GameScene extends Phaser.Scene {
  private client = RealtimeClient.getInstance();
  private group!: Phaser.GameObjects.Group;
  private playerId!: string;
  private roomCode!: string;
  private idMap = new Map<number, IdCircle>();
  private nameMap = new Map<number, TableCircle>();
  private leaderboardText!: Phaser.GameObjects.Text;
  private audio!: AudioService;
  private lastCollisionSfxAt = 0;
  private selected?: { kind: 'id' | 'name'; pairId: number; circle: Phaser.GameObjects.Container };
  private feedbackText?: Phaser.GameObjects.Text;

  constructor() { super('GameScene'); }

  create(data: { roomCode: string; playerId: string }) {
    this.roomCode = data?.roomCode;
    this.playerId = data?.playerId;
    this.audio = new AudioService(this);

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    this.group = this.add.group();
    // Enable collisions between bubbles within the same group
    this.physics.add.collider(this.group, this.group, () => {
      const now = Date.now();
      if (now - this.lastCollisionSfxAt > 120) {
        this.audio.playCollisionSfx();
        this.lastCollisionSfxAt = now;
      }
    });

    const margin = 40;
    const cols = Math.floor(this.scale.width / (GameplayConfig.circleRadius * 2 + margin));
    let x = margin + GameplayConfig.circleRadius;
    let y = margin + GameplayConfig.circleRadius;
    const inc = GameplayConfig.circleRadius * 2 + margin;

    const addCircle = (obj: Phaser.GameObjects.Container) => {
      this.group.add(obj);
      obj.setPosition(x, y);
      obj.setInteractive({ useHandCursor: true });
      obj.on('pointerup', () => this.onLocalClick(obj as any));
      x += inc;
      if (x + GameplayConfig.circleRadius > this.scale.width) {
        x = margin + GameplayConfig.circleRadius;
        y += inc;
      }
    };

    // Leaderboard UI
    this.leaderboardText = this.add.text(12, 8, 'Leaderboard', {
      fontFamily: 'Orbitron', fontSize: '16px', color: '#e2e8f0'
    }).setDepth(10);
    this.feedbackText = this.add.text(this.scale.width / 2, 24, '', {
      fontFamily: 'Orbitron', fontSize: '18px', color: '#e2e8f0'
    }).setOrigin(0.5).setDepth(20);

    // Subscribe to server events
    this.client.onStandard('game:update_bubbles', ({ pairs, players }) => {
      // Build circles deterministically from pairs order
      pairs.forEach((p: PairItem, i: number) => {
        const idC = new IdCircle(this, 0, 0, i * 2 + 1, p.id);
        const nameC = new TableCircle(this, 0, 0, i * 2 + 2, p.name);
        this.idMap.set(p.id, idC);
        this.nameMap.set(p.id, nameC);
        addCircle(idC);
        addCircle(nameC);
        if (p.matched) {
          idC.setDisabled(true);
          nameC.setDisabled(true);
        }
      });
      this.updateLeaderboard(players);
    });

    // Fallback: fetch room state if socket event was missed
    this.fetchRoomState();

    this.client.onStandard('game:match', ({ playerId, pairId }) => {
      const idC = this.idMap.get(pairId);
      const nameC = this.nameMap.get(pairId);
      if (idC && nameC) {
        idC.setMatched();
        nameC.setMatched();
      }
    });

    this.client.on('selection_update', ({ playerId, selection }) => {
      if (playerId !== this.playerId) return;
      // Toggle selection local feedback for my client only
      this.clearSelections();
      if (selection && selection.kind === 'id') this.idMap.get(selection.pairId)?.setSelected(true);
      else if (selection && selection.kind === 'name') this.nameMap.get(selection.pairId)?.setSelected(true);
    });

    this.client.onStandard('leaderboard:update', ({ players }) => {
      this.updateLeaderboard(players);
    });

    this.client.onStandard('game:mismatch', ({ playerId }) => {
      if (playerId === this.playerId) {
        this.showFeedback('Mismatch', '#ff2e63');
      }
      this.updateLeaderboard(players);
    });
  }

  private clearSelections() {
    this.idMap.forEach(c => c.setSelected(false));
    this.nameMap.forEach(c => c.setSelected(false));
  }

  private onLocalClick(obj: Phaser.GameObjects.Container & { id: number }) {
    // Do not alter physics velocity on click; keep movement natural

    // Determine kind and pair id from text
    const text = (obj.getAt(1) as Phaser.GameObjects.Text)?.text || '';
    const num = parseInt(text, 10);
    if (Number.isNaN(num)) {
      // Name circle selected
      let pairId: number | undefined;
      this.nameMap.forEach((c, pid) => { if (c === obj) pairId = pid; });
      if (pairId === undefined) return;
      this.handleSelection('name', pairId, obj);
      // Emit to backend for room sync
      if (this.roomCode && this.playerId) this.client.emitBubbleClick(this.roomCode, this.playerId, pairId, 'name');
    } else {
      // ID circle clicked (its text is the numeric id)
      const idPairId = num;
      this.handleSelection('id', idPairId, obj);
      if (this.roomCode && this.playerId) this.client.emitBubbleClick(this.roomCode, this.playerId, idPairId, 'id');
    }
  }

  private handleSelection(kind: 'id' | 'name', pairId: number, circle: Phaser.GameObjects.Container) {
    const isName = kind === 'name';
    const isId = kind === 'id';

    // If no selection, select current and guide by disabling same-kind others
    if (!this.selected) {
      this.selected = { kind, pairId, circle };
      (circle as any).setSelected?.(true);
      // Disable other of the same kind to guide the next choice
      if (isName) {
        this.nameMap.forEach((c, pid) => c.setDisabled(pid !== pairId));
        this.idMap.forEach(c => c.setDisabled(false));
      } else if (isId) {
        this.idMap.forEach((c, pid) => c.setDisabled(pid !== pairId));
        this.nameMap.forEach(c => c.setDisabled(false));
      }
      this.audio.playSelectSfx();
      this.showFeedback('', '#e2e8f0');
      return;
    }

    // If clicking same kind, move selection to this bubble
    if (this.selected.kind === kind) {
      (this.selected.circle as any).setSelected?.(false);
      this.selected = { kind, pairId, circle };
      (circle as any).setSelected?.(true);
      if (isName) {
        this.nameMap.forEach((c, pid) => c.setDisabled(pid !== pairId));
      } else {
        this.idMap.forEach((c, pid) => c.setDisabled(pid !== pairId));
      }
      this.audio.playSelectSfx();
      return;
    }

    // Opposite kind: evaluate match
    const isMatch = pairId === this.selected.pairId;
    const otherCircle = this.selected.circle as any;
    if (isMatch) {
      otherCircle.setSelected?.(true);
      (circle as any).setSelected?.(true);
      this.audio.playMatchSuccessSfx();
      this.showFeedback('Match!', '#6bffb8');
      // Re-enable all
      this.nameMap.forEach(c => c.setDisabled(false));
      this.idMap.forEach(c => c.setDisabled(false));
      this.selected = undefined;
      // Removal will be handled by server 'pair_matched' broadcast
    } else {
      this.audio.playMismatchSfx();
      this.showFeedback('Mismatch', '#ff2e63');
      this.shake(circle);
      this.shake(this.selected.circle);
      // Clear visuals and re-enable all
      otherCircle.setSelected?.(false);
      (circle as any).setSelected?.(false);
      this.nameMap.forEach(c => c.setDisabled(false));
      this.idMap.forEach(c => c.setDisabled(false));
      this.selected = undefined;
    }
  }

  private showFeedback(text: string, color: string) {
    if (!this.feedbackText) return;
    this.feedbackText.setText(text || '');
    this.feedbackText.setColor(color || '#e2e8f0');
    if (text) {
      this.tweens.add({ targets: this.feedbackText, alpha: 1, duration: 80 });
      this.time.delayedCall(600, () => {
        this.tweens.add({ targets: this.feedbackText!, alpha: 0, duration: 220 });
      });
    }
  }

  private shake(obj: Phaser.GameObjects.Container) {
    this.tweens.add({ targets: obj, x: obj.x + 6, duration: 60, yoyo: true, repeat: 2 });
  }

  private updateLeaderboard(players: Array<{ name: string; matches: number; score: number }>) {
    const lines = players.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} - ${p.matches} matches (${p.score})`);
    this.leaderboardText.setText(['Top Matchers', ...lines].join('\n'));
  }

  private async fetchRoomState() {
    try {
      const resp = await fetch(BackendConfig.apiUrl + `/rooms/${this.roomCode}/state`);
      const data = await resp.json();
      if (data?.pairs && Array.isArray(data.pairs)) {
        // Trigger rendering path via synthetic event
        (this.client as any).socket?.emit('game:update_bubbles', { pairs: data.pairs, players: data.players ?? [] });
      }
    } catch {}
  }
 

  update(time: number) {
    this.group.getChildren().forEach((c) => {
      const obj = c as any;
      if (obj.applyFlow) obj.applyFlow(time);
    });
  }
}
