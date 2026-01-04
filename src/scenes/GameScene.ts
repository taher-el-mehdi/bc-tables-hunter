import Phaser from 'phaser';
import { TableCircle } from '../objects/TableCircle';
import { IdCircle } from '../objects/IdCircle';
import { ScoreService } from '../services/ScoreService';
import { GameplayConfig } from '../config/gameConfig';
import tablesData from '../data/tables.json';
import { BaseCircle } from '../objects/BaseCircle';
import { AudioService } from '../services/AudioService';

export class GameScene extends Phaser.Scene {
  private scoreService: ScoreService;
  private circlesGroup!: Phaser.Physics.Arcade.Group;
  private availableTables: any[] = [];
  private selectedCircle: BaseCircle | null = null;
  
  private matchedText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private startTime: number = 0;
  private timerEvent?: Phaser.Time.TimerEvent;
  private timerBg!: Phaser.GameObjects.Rectangle;
  private gameEnded: boolean = false;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private lastCollisionTime: number = 0;
  private lastWallTime: number = 0;

  constructor() {
    super('GameScene');
    this.scoreService = new ScoreService();
  }

  create() {
    this.availableTables = [...tablesData];
    this.scoreService.reset();
    this.scoreService.setTotalTables(tablesData.length);
    
    // UI
    this.createUI();

    // Responsive adjustments (mobile/desktop)
    this.adaptForDevice();
    this.scale.on('resize', this.onResize, this);

    // Physics boundaries
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    
    // Circles Group
    this.circlesGroup = this.physics.add.group({
      bounceX: 1,
      bounceY: 1,
      collideWorldBounds: true
    });

    // Collision between circles (with callback to play impact sounds)
    this.physics.add.collider(this.circlesGroup, this.circlesGroup, this.onCircleCollision, undefined, this);
    // Listen for collisions with world bounds (bodies must set onWorldBounds = true)
    this.physics.world.on('worldbounds', this.onWorldBounds, this);

    // Initial Spawn
    this.spawnPair();
    this.spawnPair();

    // Spawn Timer (kept as a property so it can be adjusted for different screen sizes)
    this.spawnTimer = this.time.addEvent({
      delay: GameplayConfig.spawnInterval,
      callback: this.spawnPair,
      callbackScope: this,
      loop: true
    });
    
    // Initial UI Update
    this.updateUI();

    // Start game timer (displayed top-right)
    this.startTime = Date.now();
    this.gameEnded = false;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.updateTimer,
      callbackScope: this
    });
    this.updateTimer();
  }

  private createUI() {
    this.matchedText = this.add.text(20, 20, 'Matched: 0', {
      fontFamily: 'Orbitron',
      fontSize: '22px',
      color: '#' + GameplayConfig.colors.matched.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    });

    // Remaining count displayed below matched
    this.remainingText = this.add.text(20, 48, 'Remaining: 0 ⏳', {
      fontFamily: 'Orbitron',
      fontSize: '18px',
      color: '#' + GameplayConfig.colors.ui.textDim.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    });

    // Timer displayed at top-right with fixed-width background to avoid layout shift
    const timerWidth = 120;
    const timerHeight = 32;
    const timerX = this.scale.width - 20;
    const timerY = 20;
    this.timerBg = this.add.rectangle(timerX, timerY, timerWidth, timerHeight, GameplayConfig.colors.ui.backgroundAlt, 0.6).setOrigin(1, 0).setStrokeStyle(2, GameplayConfig.colors.ui.primary, 0.3);
    this.timeText = this.add.text(timerX - timerWidth / 2, timerY + timerHeight / 2, '00:00:00', {
      fontFamily: 'Orbitron',
      fontSize: '16px',
      color: '#' + GameplayConfig.colors.ui.primary.toString(16).padStart(6, '0'),
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.messageText = this.add.text(this.scale.width / 2, this.scale.height - 50, '', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      color: '#' + GameplayConfig.colors.ui.accent.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  private spawnPair() {
    if (this.circlesGroup.getLength() >= GameplayConfig.maxCircles) return;
    if (this.availableTables.length === 0) return;

    // Pick random table and remove from available
    const index = Phaser.Math.Between(0, this.availableTables.length - 1);
    const tableData = this.availableTables.splice(index, 1)[0];
    
    const padding = GameplayConfig.circleRadius * 2;
    const x1 = Phaser.Math.Between(padding, this.scale.width - padding);
    const y1 = Phaser.Math.Between(padding, this.scale.height - padding);
    
    const x2 = Phaser.Math.Between(padding, this.scale.width - padding);
    const y2 = Phaser.Math.Between(padding, this.scale.height - padding);

    const tableCircle = new TableCircle(this, x1, y1, tableData.id, tableData.name);
    const idCircle = new IdCircle(this, x2, y2, tableData.id);

    // Add to group
    this.circlesGroup.add(tableCircle);
    this.circlesGroup.add(idCircle);

    // Re-apply velocity after adding to group (sometimes group defaults override)
    // Speed scales with radius so movement feels consistent across screen sizes - bumped for snappier motion
    const speed = Math.max(40, Math.round(GameplayConfig.circleRadius * 1.05));
    (tableCircle.body as Phaser.Physics.Arcade.Body).setVelocity(
      Phaser.Math.Between(-speed, speed), 
      Phaser.Math.Between(-speed, speed)
    );
    (idCircle.body as Phaser.Physics.Arcade.Body).setVelocity(
      Phaser.Math.Between(-speed, speed), 
      Phaser.Math.Between(-speed, speed)
    );
    (tableCircle.body as Phaser.Physics.Arcade.Body).setBounce(1, 1);
    (idCircle.body as Phaser.Physics.Arcade.Body).setBounce(1, 1);
    (tableCircle.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (tableCircle.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;
    (idCircle.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    (idCircle.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;

    // Interaction
    tableCircle.on('pointerdown', () => this.handleCircleClick(tableCircle));
    idCircle.on('pointerdown', () => this.handleCircleClick(idCircle));
    
    // Pop-in animation (small -> normal) to make spawns feel lively
    tableCircle.setScale(0);
    tableCircle.setAlpha(0);
    idCircle.setScale(0);
    idCircle.setAlpha(0);

    const popDuration = 220;
    this.tweens.add({
      targets: tableCircle,
      scale: 1,
      alpha: 1,
      duration: popDuration,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: idCircle,
      scale: 1,
      alpha: 1,
      duration: popDuration,
      delay: 80,
      ease: 'Back.easeOut'
    });
    
    // Update UI (Remaining count changed)
    this.updateUI();
  }

  private handleCircleClick(circle: BaseCircle) {
    if (!this.selectedCircle) {
      // Select first circle
      this.selectedCircle = circle;
      this.selectedCircle.setSelected(true);
      // Play selection sound
      try { AudioService.getInstance().playSelectSound(); } catch (e) {}
      // Disable other circles of the same type to avoid other selections
      this.setSameTypeDisabled(circle.constructor, true, circle);
      return;
    }

    if (this.selectedCircle === circle) {
      // Deselect
      this.selectedCircle.setSelected(false);
      // Play deselect sound
      try { AudioService.getInstance().playDeselectSound(); } catch (e) {}
      // Re-enable same-type circles
      this.setSameTypeDisabled(circle.constructor, false);
      this.selectedCircle = null;
      return;
    }
    
    // Check if same type (ignore)
    if (this.selectedCircle.constructor === circle.constructor) {
       return;
    }

    // Attempt Match
    const isCorrect = this.scoreService.validateMatch(this.selectedCircle.id, circle.id);

    if (isCorrect) {
      this.handleCorrectMatch(this.selectedCircle, circle);
    } else {
      this.handleWrongMatch(circle);
    }
  }

  private handleCorrectMatch(circle1: BaseCircle, circle2: BaseCircle) {
    // Disable physics to stop movement/collision during animation
    if (circle1.body) (circle1.body as Phaser.Physics.Arcade.Body).enable = false;
    if (circle2.body) (circle2.body as Phaser.Physics.Arcade.Body).enable = false;

    // Snap animation
    const snapX = (circle1.x + circle2.x) / 2;
    const snapY = (circle1.y + circle2.y) / 2;

    this.tweens.add({
      targets: [circle1, circle2],
      x: snapX,
      y: snapY,
      duration: 300,
      onComplete: () => {
        // Pop-in visual feedback at match location
        const popup = this.add.text(snapX, snapY - 10, 'Matched!', {
          fontFamily: 'Orbitron',
          fontSize: '28px',
          color: '#' + GameplayConfig.colors.matched.toString(16).padStart(6, '0'),
          fontStyle: 'bold'
        }).setOrigin(0.5).setScale(0).setAlpha(0);

        this.tweens.add({
          targets: popup,
          scale: 1.15,
          alpha: 1,
          duration: 260,
          ease: 'Back.easeOut',
          yoyo: true,
          hold: 300,
          onComplete: () => {
            this.tweens.add({
              targets: popup,
              alpha: 0,
              duration: 200,
              onComplete: () => popup.destroy()
            });
          }
        });

        // small vibration on supported devices
        if (navigator && (navigator as any).vibrate) {
          try { (navigator as any).vibrate(60); } catch (e) { /* ignore */ }
        }

        // Play success sound
        this.playMatchedSound();

        circle1.setMatched();
        circle2.setMatched();
        this.circlesGroup.remove(circle1);
        this.circlesGroup.remove(circle2);
      }
    });

    this.selectedCircle = null;
    // Re-enable any disabled circles (other circles of both types)
    this.setSameTypeDisabled(TableCircle, false);
    this.setSameTypeDisabled(IdCircle, false);
    this.updateUI();
  }

  private handleWrongMatch(clicked?: BaseCircle) {
    // Visual center for popup - prefer the last clicked circle, otherwise the currently selected circle, otherwise center
    const px = clicked ? clicked.x : (this.selectedCircle ? this.selectedCircle.x : this.scale.width / 2);
    const py = clicked ? clicked.y : (this.selectedCircle ? this.selectedCircle.y : this.scale.height / 2);

    // Red popup near the match location (slightly offset upward)
    const wrongPopup = this.add.text(px, py - 10, 'Wrong Match!', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      color: '#FF0000' ,//+ GameplayConfig.colors.id.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: wrongPopup,
      scale: 1.05,
      alpha: 1,
      duration: 220,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 300,
      onComplete: () => {
        this.tweens.add({
          targets: wrongPopup,
          alpha: 0,
          duration: 180,
          onComplete: () => wrongPopup.destroy()
        });
      }
    });

    // Haptic feedback on supported devices
    if (navigator && (navigator as any).vibrate) {
      try { (navigator as any).vibrate([80, 40, 80]); } catch (e) {/* ignore */}
    }

    // Play error sound
    this.playWrongSound();

    this.cameras.main.shake(220, 0.015);

    if (this.selectedCircle) {
      this.selectedCircle.setSelected(false);
      try { AudioService.getInstance().playDeselectSound(); } catch (e) {}
    }

    // Re-enable all circles
    this.setSameTypeDisabled(TableCircle, false);
    this.setSameTypeDisabled(IdCircle, false);
    this.selectedCircle = null;

    this.updateUI();
  }

  private updateUI() {
    const matched = this.scoreService.getMatchedCount();
    const remaining = this.scoreService.getRemainingCount();
    
    this.matchedText.setText(`Matched: ${matched}`);
    this.remainingText.setText(`Remaining: ${remaining}`);
  }

  private updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (this.timeText) {
      this.timeText.setText(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }

    // Stop timer if game is finished and dim the timer background
    const remaining = this.scoreService.getRemainingCount();
    if (remaining === 0 && !this.gameEnded) {
      this.gameEnded = true;
      if (this.timerEvent) {
        this.timerEvent.remove(false);
      }
      // visually mark finished state (read timerBg to avoid unused variable error)
      if (this.timerBg) {
        this.timerBg.setFillStyle(0x0a0a0a, 0.22);
        (this.timeText as Phaser.GameObjects.Text).setColor('#aaaaaa');
      }

      // Transition to Result Scene after a short delay to allow match animation
      this.time.delayedCall(400, () => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        const matched = this.scoreService.getMatchedCount();
        this.scene.start('ResultScene', { matched, time: timeString });
      });
    }
  }

  // Adjust gameplay parameters for smaller screens and reconfigure spawn timer
  private adaptForDevice() {
    const { width, height } = this.scale;
    const minSide = Math.min(width, height);

    if (minSide < 420) {
      GameplayConfig.circleRadius = 40;
      GameplayConfig.maxCircles = 6;
      GameplayConfig.spawnInterval = 3000;
    } else if (minSide < 720) {
      GameplayConfig.circleRadius = 50;
      GameplayConfig.maxCircles = 8;
      GameplayConfig.spawnInterval = 2400;
    } else {
      GameplayConfig.circleRadius = 60;
      GameplayConfig.maxCircles = 10;
      GameplayConfig.spawnInterval = 2000;
    }

    // Restart spawn timer with new interval
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
    }
    this.spawnTimer = this.time.addEvent({
      delay: GameplayConfig.spawnInterval,
      callback: this.spawnPair,
      callbackScope: this,
      loop: true
    });
  }

  // Handle repositioning of HUD and physics bounds on resize
  private onResize() {
    const { width, height } = this.scale;

    // update physics bounds
    this.physics.world.setBounds(0, 0, width, height);

    // reposition HUD
    this.matchedText.setPosition(20, 20);
    this.remainingText.setPosition(20, 48);
    const timerX = width - 20;
    const timerY = 20;
    const timerWidth = this.timerBg.width || 120;
    this.timerBg.setPosition(timerX, timerY);
    this.timerBg.setSize(timerWidth, 32);
    this.timeText.setPosition(timerX - timerWidth / 2, timerY + 16);
    this.messageText.setPosition(width / 2, height - 50);
  }

  private playMatchedSound() {
    try {
      // Try to use the Web Audio API for a short tonal effect (no external files)
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1000, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      // slight frequency fall for a pleasant 'pop' feel
      o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.20);
      setTimeout(() => {
        try { o.stop(); ctx.close(); } catch (e) { /* ignore */ }
      }, 220);
    } catch (e) {
      // ignore audio failures
    }
  }

  private playWrongSound() {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      // harsher timbre for error
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(900, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.005);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      // quick downward and then stop for an 'error' sting
      o.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.14);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.20);
      setTimeout(() => {
        try { o.stop(); ctx.close(); } catch (e) { /* ignore */ }
      }, 240);
    } catch (e) {
      // ignore
    }
  }

  // Called by the physics collider when two circles collide
  private onCircleCollision(objA: any, objB: any) {
    try {
      const bA = (objA.body as Phaser.Physics.Arcade.Body);
      const bB = (objB.body as Phaser.Physics.Arcade.Body);
      if (!bA || !bB) return;

      const rvx = bA.velocity.x - bB.velocity.x;
      const rvy = bA.velocity.y - bB.velocity.y;
      const magnitude = Math.hypot(rvx, rvy);

      const now = Date.now();
      if (now - this.lastCollisionTime < 60) return; // throttle
      this.lastCollisionTime = now;

      // Only play crash sound when circles are of different colors (i.e., a "meaningful" collision)
      let colorA: number | undefined;
      let colorB: number | undefined;
      try {
        colorA = objA.circle && (objA.circle.fillColor !== undefined) ? objA.circle.fillColor : undefined;
        colorB = objB.circle && (objB.circle.fillColor !== undefined) ? objB.circle.fillColor : undefined;
      } catch (e) { /* ignore */ }

      if (colorA !== undefined && colorB !== undefined && colorA !== colorB) {
        // compute approximate collision x for stereo panning
        const collX = (objA.x + objB.x) / 2;
        this.playCollisionSound(magnitude, collX);
        // small vibration for heavier impacts only for different-color collisions
        if (magnitude > 80 && navigator && (navigator as any).vibrate) {
          try { (navigator as any).vibrate(20); } catch (e) { /* ignore */ }
        }
      }

    } catch (e) { /* ignore */ }
  }

  // Called when a body hits the world bounds
  private onWorldBounds(body: Phaser.Physics.Arcade.Body) {
    try {
      const vel = Math.hypot(body.velocity.x, body.velocity.y);
      const now = Date.now();
      if (now - this.lastWallTime < 80) return; // throttle
      this.lastWallTime = now;

      this.playWallSound(vel);

      if (vel > 120 && navigator && (navigator as any).vibrate) {
        try { (navigator as any).vibrate(30); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  }

  private playCollisionSound(magnitude: number = 100, xPos?: number) {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      const vol = Math.min(0.6, Math.max(0.02, magnitude / 400));
      masterGain.gain.exponentialRampToValueAtTime(vol, now + 0.004);

      // stereo panner based on x position (if provided)
      let panner: StereoPannerNode | null = null;
      if (xPos !== undefined && (ctx.createStereoPanner)) {
        panner = (ctx as any).createStereoPanner();
        const width = (this.sys && (this.sys.game as any).config && (this.sys.game as any).config.width) ? Number((this.sys.game as any).config.width) : window.innerWidth;
        const pan = Math.max(-1, Math.min(1, (xPos - width / 2) / (width / 2)));
        if (panner && (panner as any).pan && typeof (panner as any).pan.setValueAtTime === 'function') {
          (panner as any).pan.setValueAtTime(pan, now);
        }
      }

      // 1) noise burst (filtered) for crash texture
      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      const centerFreq = Math.min(1200, Math.max(200, 300 + magnitude * 3));
      noiseFilter.frequency.setValueAtTime(centerFreq, now);
      noiseFilter.Q.setValueAtTime(8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(1.0, now + 0.01);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

      // 2) short metallic snap oscillator for attack
      const snap = ctx.createOscillator();
      snap.type = 'triangle';
      const snapFreq = Math.min(3000, Math.max(800, 800 + magnitude * 3));
      snap.frequency.setValueAtTime(snapFreq, now);
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.0001, now);
      snapGain.gain.exponentialRampToValueAtTime(0.8, now + 0.004);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      // routing
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      snap.connect(snapGain);
      snapGain.connect(masterGain);

      if (panner) {
        masterGain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        masterGain.connect(ctx.destination);
      }

      noiseSrc.start(now);
      snap.start(now);

      // stop and cleanup
      noiseSrc.stop(now + 0.28);
      snap.stop(now + 0.14);
      setTimeout(() => {
        try { ctx.close(); } catch (e) { /* ignore */ }
      }, 400);
    } catch (e) { /* ignore */ }
  }

  private playWallSound(magnitude: number = 100) {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      const freq = Math.min(900, Math.max(120, 180 + magnitude));
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      const vol = Math.min(0.2, Math.max(0.02, magnitude / 900));
      g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.005);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      setTimeout(() => { try { o.stop(); ctx.close(); } catch (e) { } }, 180);
    } catch (e) { /* ignore */ }
  }

  private setSameTypeDisabled(type: any, disabled: boolean, exclude?: BaseCircle) {
    this.circlesGroup.getChildren().forEach((c: any) => {
      const circ = c as BaseCircle;
      if (circ.constructor === type && circ !== exclude) {
        circ.setDisabled(disabled);
      }
    });
  }

  update() {
    // Optional: cleanup out of bounds if needed
  }
}
