/**
 * Client-side Web Audio API synthesizer for generating upbeat social video beats
 * and background music without needing external mp3 files.
 */
class VideoAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private tempo = 120;
  private intervalId: any = null;
  private isMuted = false;
  private gainNode: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public playKick(time: number) {
    if (!this.ctx || !this.gainNode || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  public playHiHat(time: number) {
    if (!this.ctx || !this.gainNode || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(8000, time);
    osc.frequency.exponentialRampToValueAtTime(2000, time + 0.05);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  public playSynthChord(time: number, chordType: 'cyber' | 'luxe' | 'neon') {
    if (!this.ctx || !this.gainNode || this.isMuted) return;
    const freqs = chordType === 'cyber' ? [220, 277.18, 329.63] : [174.61, 220, 261.63];

    freqs.forEach(freq => {
      if (!this.ctx || !this.gainNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.gainNode);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  public startBeat() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    let step = 0;
    const secondsPerBeat = 60 / this.tempo / 2; // 8th notes

    this.intervalId = setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;

      // 4/4 Beat pattern
      if (step % 4 === 0) {
        this.playKick(now);
      }
      this.playHiHat(now);

      if (step % 8 === 0) {
        this.playSynthChord(now, 'cyber');
      }

      step = (step + 1) % 16;
    }, secondsPerBeat * 1000);
  }

  public stopBeat() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const audioEngine = new VideoAudioEngine();
