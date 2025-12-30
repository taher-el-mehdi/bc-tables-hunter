export class AudioService {
  private static _instance: AudioService | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private muted = false;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService._instance) AudioService._instance = new AudioService();
    return AudioService._instance;
  }

  public init() {
    try {
      if (this.ctx) return;
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const ctx = this.ctx!;
      const master = ctx.createGain();
      this.masterGain = master;
      master.gain.value = this.muted ? 0.0001 : 0.06; // low volume
      master.connect(ctx.destination);


      // restore muted from localStorage
      const stored = localStorage.getItem('audioMuted');
      if (stored !== null) {
        this.muted = stored === '1';
        if (this.masterGain) this.masterGain.gain.value = this.muted ? 0.0001 : 0.06;
      }
    } catch (e) {
      // ignore
    }
  }

  public playBackground() {
    try {
      if (!this.ctx || !this.masterGain) this.init();
      if (!this.ctx || !this.masterGain) return;
      if (this.isPlaying) return;

      // if context suspended due to autoplay policies, handle resume later
      if (this.ctx.state === 'suspended') {
        this.resumeOnUserGesture();
        return;
      }

      // create gentle ambient pad using two detuned oscillators and a lowpass filter
      const f1 = this.ctx.createOscillator();
      const f2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      f1.type = 'sine';
      f2.type = 'sine';
      f1.frequency.value = 220;
      f2.frequency.value = 110;
      f2.detune.value = 6;

      filter.type = 'lowpass';
      filter.frequency.value = 900;

      g.gain.value = 0.03; // very low

      f1.connect(filter);
      f2.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);

      // gentle LFO on filter cutoff
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      f1.start(); f2.start(); lfo.start();

      // store nodes so we can stop them later
      (this as any)._bg = { f1, f2, lfo, lfoGain, filter, g };
      this.isPlaying = true;
    } catch (e) {
      // ignore
    }
  }

  public stopBackground() {
    if (!this.isPlaying) return;
    try {
      const bg = (this as any)._bg;
      if (bg) {
        try { bg.f1.stop(); } catch(e) {}
        try { bg.f2.stop(); } catch(e) {}
        try { bg.lfo.stop(); } catch(e) {}
        // disconnect
        try { bg.f1.disconnect(); } catch(e) {}
        try { bg.f2.disconnect(); } catch(e) {}
        try { bg.lfo.disconnect(); } catch(e) {}
        try { bg.lfoGain.disconnect(); } catch(e) {}
        try { bg.filter.disconnect(); } catch(e) {}
        try { bg.g.disconnect(); } catch(e) {}
      }
    } catch (e) {
      // ignore
    }
    this.isPlaying = false;
    (this as any)._bg = null;
  }

  public toggleMute() {
    this.setMuted(!this.muted);
  }

  public setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0.0001 : 0.06;
    localStorage.setItem('audioMuted', this.muted ? '1' : '0');
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public resumeOnUserGesture() {
    try {
      const handler = () => {
        if (!this.ctx) return;
        this.ctx.resume().then(() => {
          this.playBackground();
        }).catch(() => {});
        document.removeEventListener('pointerdown', handler);
      };
      document.addEventListener('pointerdown', handler);
    } catch (e) { /* ignore */ }
  }

  public playSelectSound() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1200, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      o.connect(g);
      g.connect(this.masterGain);
      o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
      o.start();
      setTimeout(() => { try { o.stop(); } catch (e) {} }, 160);
    } catch (e) { /* ignore */ }
  }

  public playDeselectSound() {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(640, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
      o.connect(g);
      g.connect(this.masterGain);
      o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.start();
      setTimeout(() => { try { o.stop(); } catch (e) {} }, 140);
    } catch (e) { /* ignore */ }
  }
}

