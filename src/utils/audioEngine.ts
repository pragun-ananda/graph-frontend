import { useStore } from '../store/useStore';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;

  // Synthesizer Oscillators for procedural sci-fi ambient audio
  private droneOsc: OscillatorNode | null = null;
  private leadOsc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  public init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);

    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public async togglePlayback(): Promise<boolean> {
    if (!this.ctx) {
      this.init();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isRunning) {
      this.stopSynthesizer();
      this.stopAnalysisLoop();
      this.isRunning = false;
      useStore.getState().setAudioData({ isPlaying: false, bass: 0, mid: 0, treble: 0, volume: 0 });
      return false;
    } else {
      this.startSynthesizer();
      this.startAnalysisLoop();
      this.isRunning = true;
      useStore.getState().setAudioData({ isPlaying: true });
      return true;
    }
  }

  private startSynthesizer() {
    if (!this.ctx || !this.gainNode) return;

    // Sub-bass drone (55 Hz - A1)
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sawtooth';
    this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Filter for deep warm bass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    // LFO for atmospheric sweeping filter cutoff
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 0.2 Hz slow pulse
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(filter.frequency);

    // Sub harmonic secondary synth lead
    this.leadOsc = this.ctx.createOscillator();
    this.leadOsc.type = 'sine';
    this.leadOsc.frequency.setValueAtTime(220, this.ctx.currentTime);

    const leadGain = this.ctx.createGain();
    leadGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.droneOsc.connect(filter);
    filter.connect(this.gainNode);

    this.leadOsc.connect(leadGain);
    leadGain.connect(this.gainNode);

    this.droneOsc.start();
    this.leadOsc.start();
    this.lfo.start();
  }

  private stopSynthesizer() {
    if (this.droneOsc) {
      try { this.droneOsc.stop(); } catch (_) {}
      this.droneOsc.disconnect();
      this.droneOsc = null;
    }
    if (this.leadOsc) {
      try { this.leadOsc.stop(); } catch (_) {}
      this.leadOsc.disconnect();
      this.leadOsc = null;
    }
    if (this.lfo) {
      try { this.lfo.stop(); } catch (_) {}
      this.lfo.disconnect();
      this.lfo = null;
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.05);
      useStore.getState().setAudioData({ volume: clamped });
    }
  }

  private startAnalysisLoop() {
    const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!this.isRunning || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Compute bass, mid, treble normalized floats (0.0 to 1.0)
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < 8; i++) bassSum += dataArray[i]; // 0-8 bins (Bass)
      for (let i = 8; i < 28; i++) midSum += dataArray[i]; // 8-28 bins (Mid)
      for (let i = 28; i < 64; i++) trebleSum += dataArray[i]; // 28-64 bins (Treble)

      const bass = Math.min(1, bassSum / (8 * 255));
      const mid = Math.min(1, midSum / (20 * 255));
      const treble = Math.min(1, trebleSum / (36 * 255));

      useStore.getState().setAudioData({
        bass,
        mid,
        treble,
        rawFftData: new Uint8Array(dataArray)
      });

      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  private stopAnalysisLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const audioEngine = new AudioEngine();
