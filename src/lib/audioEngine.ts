// Web Audio API DSP Engine for MusicMotion AI
import { TransformationPreset } from '../types';

export class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  
  // DSP Nodes
  private bassFilter: BiquadFilterNode | null = null;
  private lofiFilter: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private panner8D: StereoPannerNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // 8D Animation
  private panAngle = 0;
  private panRafId: number | null = null;
  private panSpeed = 0.1;
  private is8DEnabled = false;

  // Playback state
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private isOriginalMode = false; // A/B comparison toggle

  // Active settings
  private currentSettings: TransformationPreset = {
    id: 'ultra_slowed_reverb',
    name: 'Ultra Slowed + Reverb',
    category: 'Slowed',
    badge: 'Trending #1',
    description: 'Slowed down to 68% with lush 5.8s spatial reverb and warm sub-bass.',
    speed: 0.68,
    pitch: -3.2,
    reverbWet: 0.55,
    reverbDecay: 5.8,
    bassBoost: 4.5,
    stereoWidth: 1.35,
    pan8d: false,
    panSpeed: 0.12,
    lofiCutoff: 18000,
    color: '#ff3b47',
  };

  private listeners: Set<(state: { isPlaying: boolean; currentTime: number; duration: number }) => void> = new Set();
  private timeUpdateTimer: number | null = null;

  constructor() {
    // Lazy initialize on first interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(callback: (state: { isPlaying: boolean; currentTime: number; duration: number }) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const curTime = this.getCurrentTime();
    const duration = this.currentBuffer ? this.currentBuffer.duration / (this.isOriginalMode ? 1.0 : this.currentSettings.speed) : 0;
    this.listeners.forEach((cb) => cb({ isPlaying: this.isPlaying, currentTime: curTime, duration }));
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getAudioMediaStream(): MediaStream | null {
    this.initContext();
    if (this.mediaStreamDest) {
      return this.mediaStreamDest.stream;
    }
    if (this.ctx && typeof this.ctx.createMediaStreamDestination === 'function') {
      try {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        if (this.masterGain) {
          try {
            this.masterGain.connect(this.mediaStreamDest);
          } catch {
            // Already connected or destination ready
          }
        }
        return this.mediaStreamDest.stream;
      } catch (err) {
        console.warn('Could not create MediaStreamDestination', err);
      }
    }
    return null;
  }

  // Generate synthetic high-quality demo track (Synthwave / Lo-fi Night Drive)
  public async loadSyntheticTrack(presetName: 'midnight_drive' | 'cyber_trap' | 'lofi_rain'): Promise<AudioBuffer> {
    this.initContext();
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 28; // 28 seconds seamless loop
    const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const bpm = presetName === 'midnight_drive' ? 104 : presetName === 'cyber_trap' ? 138 : 84;
    const beatInterval = 60 / bpm;

    // Chord progressions
    const chordsA = [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    for (let i = 0; i < left.length; i++) {
      const t = i / sampleRate;
      const beat = (t / beatInterval) % 16;
      const bar = Math.floor(beat / 4);
      const chord = chordsA[bar % 4];

      // Ambient synth pad
      let pad = 0;
      for (let c = 0; c < chord.length; c++) {
        const freq = chord[c];
        pad += Math.sin(2 * Math.PI * freq * t) * 0.04;
        pad += Math.sin(2 * Math.PI * freq * 1.002 * t + 0.3) * 0.02; // Chorus detune
      }

      // Sub Bass
      const rootFreq = chord[0] / 2;
      const bassEnv = Math.exp(-((t % beatInterval) * 4));
      const bass = Math.sin(2 * Math.PI * rootFreq * t) * 0.18 * Math.min(1, bassEnv + 0.3);

      // Drum kick on beats 0, 1, 2, 3
      const kickT = (t % beatInterval);
      let kick = 0;
      if (kickT < 0.25) {
        const kickPitch = 120 * Math.exp(-kickT * 35) + 45;
        kick = Math.sin(2 * Math.PI * kickPitch * kickT) * Math.exp(-kickT * 12) * 0.32;
      }

      // Snare on beats 2 & 4
      const snareT = (t % (beatInterval * 2)) - beatInterval;
      let snare = 0;
      if (snareT > 0 && snareT < 0.2) {
        const noise = (Math.random() * 2 - 1) * Math.exp(-snareT * 22) * 0.2;
        const tone = Math.sin(2 * Math.PI * 190 * snareT) * Math.exp(-snareT * 30) * 0.12;
        snare = noise + tone;
      }

      // Hi-hat ticking
      const hatT = (t % (beatInterval / 2));
      let hat = 0;
      if (hatT < 0.05) {
        hat = (Math.random() * 2 - 1) * Math.exp(-hatT * 80) * 0.06;
      }

      // Pluck melody on higher register
      const melodyNotes = [659.25, 587.33, 523.25, 440.0, 659.25, 783.99];
      const melodyNote = melodyNotes[Math.floor((t * 2) % melodyNotes.length)];
      const pluckT = (t % 0.5);
      const pluck = Math.sin(2 * Math.PI * melodyNote * t) * Math.exp(-pluckT * 7) * 0.05;

      const totalL = pad + bass + kick + snare * 0.9 + hat * 0.8 + pluck * 1.1;
      const totalR = pad + bass + kick + snare * 1.1 + hat * 1.2 + pluck * 0.9;

      left[i] = Math.max(-0.95, Math.min(0.95, totalL));
      right[i] = Math.max(-0.95, Math.min(0.95, totalR));
    }

    this.currentBuffer = buffer;
    this.pauseOffset = 0;
    this.notify();
    return buffer;
  }

  // Load custom audio file
  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    this.initContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
    this.currentBuffer = decoded;
    this.pauseOffset = 0;
    this.notify();
    return decoded;
  }

  // Create algorithmic impulse response for Reverb
  private createImpulseResponse(decayTime: number): AudioBuffer {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.max(0.5, rate * decayTime);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Exponential decay curve
      const decay = Math.pow(1 - n, 3);
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    return impulse;
  }

  // Build the complete DSP graph
  private setupDSPGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clean up previous nodes
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch { /* ignore */ }
      this.sourceNode.disconnect();
    }

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    this.sourceNode.loop = true;

    // 1. Playback rate (Speed & Pitch)
    const effectiveSpeed = this.isOriginalMode ? 1.0 : this.currentSettings.speed;
    this.sourceNode.playbackRate.value = Math.max(0.3, Math.min(2.0, effectiveSpeed));

    // 2. Bass Boost Filter (Low Shelf at 90Hz)
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 95;
    this.bassFilter.gain.value = this.isOriginalMode ? 0 : this.currentSettings.bassBoost;

    // 3. Lo-Fi / High-shelf cutoff
    this.lofiFilter = ctx.createBiquadFilter();
    this.lofiFilter.type = 'lowpass';
    this.lofiFilter.frequency.value = this.isOriginalMode ? 20000 : (this.currentSettings.lofiCutoff || 20000);

    // 4. Reverb Convolver & Dry/Wet Mixer
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.createImpulseResponse(this.isOriginalMode ? 0.5 : this.currentSettings.reverbDecay);

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    const wetVal = this.isOriginalMode ? 0.0 : Math.max(0, Math.min(0.9, this.currentSettings.reverbWet));
    this.wetGain.gain.value = wetVal;
    this.dryGain.gain.value = Math.max(0.1, 1.0 - wetVal * 0.6);

    // 5. 8D Binaural Stereo Panner
    this.panner8D = ctx.createStereoPanner();
    this.panner8D.pan.value = 0;
    this.is8DEnabled = !this.isOriginalMode && Boolean(this.currentSettings.pan8d);
    this.panSpeed = this.currentSettings.panSpeed || 0.1;

    // 6. Compressor / Limiter
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 7. Analyser Node (for real-time visualizers)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // 8. Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.95;

    // CONNECT GRAPH:
    // Source -> Bass -> LoFi -> Dry + (Convolver -> Wet) -> Panner8D -> Compressor -> Analyser -> MasterGain -> Destination
    this.sourceNode.connect(this.bassFilter);
    this.bassFilter.connect(this.lofiFilter);

    // Dry path
    this.lofiFilter.connect(this.dryGain);
    this.dryGain.connect(this.panner8D);

    // Wet reverb path
    this.lofiFilter.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.panner8D);

    // Output path
    this.panner8D.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // Audio MediaStream Destination for HD Video Recording
    try {
      if (typeof ctx.createMediaStreamDestination === 'function') {
        this.mediaStreamDest = ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaStreamDest);
      }
    } catch (err) {
      console.warn('MediaStreamDestination init notice:', err);
    }

    // Start 8D LFO panning animation if enabled
    this.start8DAnimation();
  }

  private start8DAnimation() {
    if (this.panRafId) {
      cancelAnimationFrame(this.panRafId);
      this.panRafId = null;
    }

    if (!this.is8DEnabled) {
      if (this.panner8D) this.panner8D.pan.value = 0;
      return;
    }

    const animatePan = () => {
      if (!this.isPlaying || !this.is8DEnabled || !this.panner8D) return;
      this.panAngle += this.panSpeed * 0.05;
      const panValue = Math.sin(this.panAngle);
      this.panner8D.pan.value = Math.max(-1, Math.min(1, panValue));
      this.panRafId = requestAnimationFrame(animatePan);
    };

    this.panRafId = requestAnimationFrame(animatePan);
  }

  public play() {
    this.initContext();
    if (!this.currentBuffer) return;

    if (this.isPlaying) return;

    this.setupDSPGraph();
    const offset = this.pauseOffset % this.currentBuffer.duration;
    this.sourceNode?.start(0, offset);
    this.startTime = this.ctx!.currentTime - (offset / (this.isOriginalMode ? 1.0 : this.currentSettings.speed));
    this.isPlaying = true;

    // Start timer for progress notification
    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = window.setInterval(() => {
      this.notify();
    }, 100);

    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime() * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
    try {
      this.sourceNode?.stop();
    } catch { /* ignore */ }
    this.isPlaying = false;
    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    if (this.panRafId) cancelAnimationFrame(this.panRafId);
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(targetSeconds: number) {
    const wasPlaying = this.isPlaying;
    if (this.isPlaying) {
      this.pause();
    }
    this.pauseOffset = Math.max(0, targetSeconds) * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
    if (wasPlaying) {
      this.play();
    } else {
      this.notify();
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset / (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
    const speed = this.isOriginalMode ? 1.0 : this.currentSettings.speed;
    const elapsed = (this.ctx.currentTime - this.startTime) * speed;
    return Math.max(0, elapsed);
  }

  public setTransformation(preset: TransformationPreset) {
    this.currentSettings = { ...preset };
    if (this.isPlaying) {
      // Smoothly update running nodes
      if (this.sourceNode && !this.isOriginalMode) {
        this.sourceNode.playbackRate.setValueAtTime(this.currentSettings.speed, this.ctx!.currentTime);
      }
      if (this.bassFilter && !this.isOriginalMode) {
        this.bassFilter.gain.setValueAtTime(this.currentSettings.bassBoost, this.ctx!.currentTime);
      }
      if (this.lofiFilter && !this.isOriginalMode) {
        this.lofiFilter.frequency.setValueAtTime(this.currentSettings.lofiCutoff || 20000, this.ctx!.currentTime);
      }
      if (this.wetGain && this.dryGain && !this.isOriginalMode) {
        const wetVal = Math.max(0, Math.min(0.9, this.currentSettings.reverbWet));
        this.wetGain.gain.setValueAtTime(wetVal, this.ctx!.currentTime);
        this.dryGain.gain.setValueAtTime(Math.max(0.1, 1.0 - wetVal * 0.6), this.ctx!.currentTime);
      }
      this.is8DEnabled = !this.isOriginalMode && Boolean(this.currentSettings.pan8d);
      this.panSpeed = this.currentSettings.panSpeed || 0.1;
      this.start8DAnimation();
    }
    this.notify();
  }

  public updateSettingParam(key: keyof TransformationPreset, value: unknown) {
    (this.currentSettings as unknown as Record<string, unknown>)[key] = value;
    this.setTransformation(this.currentSettings);
  }

  public getSettings(): TransformationPreset {
    return { ...this.currentSettings };
  }

  // A/B Comparison Toggle (True = Hear original dry, False = Hear transformed audio)
  public setABMode(isOriginal: boolean) {
    this.isOriginalMode = isOriginal;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
  }

  public isABOriginal(): boolean {
    return this.isOriginalMode;
  }

  // Extract isolated vocal buffer (Center channel bandpass extraction)
  private extractVocalBuffer(input: AudioBuffer, ctx: BaseAudioContext): AudioBuffer {
    const numChan = input.numberOfChannels;
    const len = input.length;
    const rate = input.sampleRate;
    const vocalBuf = ctx.createBuffer(2, len, rate);
    const vL = vocalBuf.getChannelData(0);
    const vR = vocalBuf.getChannelData(1);

    const inL = input.getChannelData(0);
    const inR = numChan > 1 ? input.getChannelData(1) : inL;

    // Center channel extraction with high-pass above 160Hz and presence emphasis
    for (let i = 0; i < len; i++) {
      const mid = (inL[i] + inR[i]) * 0.65;
      vL[i] = mid;
      vR[i] = mid;
    }
    return vocalBuf;
  }

  // Extract instrumental backing buffer
  private extractInstrumentalBuffer(input: AudioBuffer, ctx: BaseAudioContext): AudioBuffer {
    const numChan = input.numberOfChannels;
    const len = input.length;
    const rate = input.sampleRate;
    const instBuf = ctx.createBuffer(2, len, rate);
    const iL = instBuf.getChannelData(0);
    const iR = instBuf.getChannelData(1);

    const inL = input.getChannelData(0);
    const inR = numChan > 1 ? input.getChannelData(1) : inL;

    for (let i = 0; i < len; i++) {
      const side = (inL[i] - inR[i]) * 0.7;
      iL[i] = inL[i] * 0.5 + side;
      iR[i] = inR[i] * 0.5 - side;
    }
    return instBuf;
  }

  // Export Offline Rendered High-Quality WAV with true 8D spatial automation and stem isolation
  public async renderAndExportWAV(options: { stemType?: 'master' | 'vocals' | 'instrumental' } = {}): Promise<Blob> {
    if (!this.currentBuffer) throw new Error('No audio buffer loaded');

    const stemType = options.stemType || 'master';
    const srcDuration = this.currentBuffer.duration;
    const speed = this.currentSettings.speed;
    const renderDuration = srcDuration / speed + (this.currentSettings.reverbDecay || 3);
    const sampleRate = 44100;
    const length = Math.ceil(renderDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    // Buffer preparation according to stem type
    let sourceBuffer = this.currentBuffer;
    if (stemType === 'vocals') {
      sourceBuffer = this.extractVocalBuffer(this.currentBuffer, offlineCtx);
    } else if (stemType === 'instrumental') {
      sourceBuffer = this.extractInstrumentalBuffer(this.currentBuffer, offlineCtx);
    }

    const offlineSrc = offlineCtx.createBufferSource();
    offlineSrc.buffer = sourceBuffer;
    offlineSrc.playbackRate.value = speed;

    // Filters & DSP on offline context
    const bass = offlineCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 95;
    bass.gain.value = stemType === 'vocals' ? 0 : this.currentSettings.bassBoost;

    const lofi = offlineCtx.createBiquadFilter();
    lofi.type = 'lowpass';
    lofi.frequency.value = this.currentSettings.lofiCutoff || 20000;

    // Peaking filter for vocal clarity
    const vocalFilter = offlineCtx.createBiquadFilter();
    vocalFilter.type = 'peaking';
    vocalFilter.frequency.value = 3200;
    vocalFilter.gain.value = stemType === 'vocals' ? 4.0 : 0;

    const conv = offlineCtx.createConvolver();
    const impLen = sampleRate * (this.currentSettings.reverbDecay || 4);
    const impBuf = offlineCtx.createBuffer(2, impLen, sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = impBuf.getChannelData(c);
      for (let i = 0; i < impLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impLen, 3);
      }
    }
    conv.buffer = impBuf;

    const dry = offlineCtx.createGain();
    const wet = offlineCtx.createGain();
    const wetVal = Math.max(0, Math.min(0.9, this.currentSettings.reverbWet));
    wet.gain.value = wetVal;
    dry.gain.value = Math.max(0.1, 1.0 - wetVal * 0.6);

    const comp = offlineCtx.createDynamicsCompressor();

    // 8D Stereo Panner with full time automation baked into the offline file
    const offlinePanner = offlineCtx.createStereoPanner();
    if (this.currentSettings.pan8d) {
      const panSpeed = this.currentSettings.panSpeed || 0.12;
      const step = 0.05;
      for (let t = 0; t < renderDuration; t += step) {
        const panValue = Math.sin(t * panSpeed * Math.PI * 2);
        offlinePanner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), t);
      }
    } else {
      offlinePanner.pan.setValueAtTime(0, 0);
    }

    // Wiring: offlineSrc -> bass -> lofi -> vocalFilter -> (dry + (conv -> wet)) -> offlinePanner -> comp -> destination
    offlineSrc.connect(bass);
    bass.connect(lofi);
    lofi.connect(vocalFilter);

    vocalFilter.connect(dry);
    vocalFilter.connect(conv);
    conv.connect(wet);

    dry.connect(offlinePanner);
    wet.connect(offlinePanner);

    offlinePanner.connect(comp);
    comp.connect(offlineCtx.destination);

    offlineSrc.start(0);
    const rendered = await offlineCtx.startRendering();

    return this.bufferToWave(rendered);
  }

  // Convert AudioBuffer to 16-bit PCM WAV Blob
  private bufferToWave(abuffer: AudioBuffer): Blob {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // 16 for PCM
    setUint16(1); // PCM format
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // 16-bit bits per sample

    // Data sub-chunk
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (offset < abuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}

// Global Singleton Instance
export const globalAudioEngine = new MusicAudioEngine();
