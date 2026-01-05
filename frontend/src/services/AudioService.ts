export class AudioService {
  private scene: Phaser.Scene;
  private music?: Phaser.Sound.BaseSound;
  private webCtx?: AudioContext;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public playMusic(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = undefined;
    }
    if (this.scene.sound.get(key)) {
      this.music = this.scene.sound.add(key, { loop: true, volume: 0.4, ...config });
      this.music.play();
    }
  }

  public stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = undefined;
    }
  }

  public playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    const sfx = this.scene.sound.get(key) || this.scene.sound.add(key);
    sfx.play(config);
  }

  // Lightweight synthesized collision sound using WebAudio (no asset required)
  public playCollisionSfx() {
    try {
      // Prefer Phaser's audio context if available
      const ctx = (this.scene.sound as any).context as AudioContext | undefined;
      const audioCtx = ctx || this.webCtx || new (window as any).AudioContext();
      this.webCtx = audioCtx;
      // Create short noise burst
      const bufferSize = 0.1 * audioCtx.sampleRate; // 100ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // white noise with decay
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 3));
      }
      const source = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.08; // quiet
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(audioCtx.destination);
      source.start();
    } catch {
      // ignore audio errors
    }
  }

  public playSelectSfx() {
    this.playTone({ freqStart: 950, freqEnd: 800, durMs: 120, type: 'triangle', gain: 0.06 });
  }

  public playMatchSuccessSfx() {
    // small two-tone chime
    this.playTone({ freqStart: 880, freqEnd: 1320, durMs: 160, type: 'sine', gain: 0.08 });
  }

  public playMismatchSfx() {
    this.playTone({ freqStart: 420, freqEnd: 300, durMs: 140, type: 'sawtooth', gain: 0.06 });
  }

  private playTone(opts: { freqStart: number; freqEnd: number; durMs: number; type: OscillatorType; gain: number }) {
    try {
      const ctx = (this.scene.sound as any).context as AudioContext | undefined;
      const audioCtx = ctx || this.webCtx || new (window as any).AudioContext();
      this.webCtx = audioCtx;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = opts.type;
      o.frequency.setValueAtTime(opts.freqStart, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(opts.freqEnd, audioCtx.currentTime + opts.durMs / 1000);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(opts.gain, audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + opts.durMs / 1000);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      setTimeout(() => { try { o.stop(); } catch {} }, opts.durMs + 30);
    } catch {}
  }
}
