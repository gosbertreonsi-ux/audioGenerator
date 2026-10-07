// Web Audio API DSP Engine for MusicMotion AI
import { TransformationPreset, StemMode, StemMixLevels } from '../types';

export class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  
  // Secondary source for swapped instrumental backing track (Afrobeat, Amapiano, etc.)
  private instrumentalSourceNode: AudioBufferSourceNode | null = null;
  private instrumentalGainNode: GainNode | null = null;
  private instrumentalBufferMap: Map<string, AudioBuffer> = new Map();

  // DSP Nodes
  private bassFilter: BiquadFilterNode | null = null;
  private lofiFilter: BiquadFilterNode | null = null;
  private vocalBandFilter: BiquadFilterNode | null = null;
  private speechPeakingFilter: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private vocalGain: GainNode | null = null;
  private beatGain: GainNode | null = null;
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

  // Stem Mode & Remixer State
  private stemMode: StemMode = 'full';
  private swappedInstrumental: string = 'none';
  private stemMixLevels: StemMixLevels = {
    vocals: 1.0,
    beat: 1.0,
    swappedInstrumental: 1.0,
    bass: 1.0,
  };

  // Active settings
  private currentSettings: TransformationPreset = {
    id: 'viral_afro_fusion',
    name: 'Afrobeat Style Shifter (Lagos Groove)',
    category: 'Remix & Swap',
    badge: 'AFROBEAT HIT',
    description: 'Mutes original drum beat, isolates vocal words, and layers authentic 114 BPM Lagos Afrobeat groove with brass horns and syncopation.',
    speed: 1.0,
    pitch: 0,
    reverbWet: 0.28,
    reverbDecay: 3.2,
    bassBoost: 6.5,
    stereoWidth: 1.65,
    pan8d: false,
    panSpeed: 0.1,
    lofiCutoff: 20000,
    color: '#f59e0b',
    stemMode: 'swapped_instrumental',
    instrumentalSwap: 'afrobeat_lagos',
  };

  private listeners: Set<(state: { isPlaying: boolean; currentTime: number; duration: number }) => void> = new Set();
  private timeUpdateTimer: number | null = null;

  constructor() {
    // Lazy initialize
  }

  public initContext() {
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
            // Already connected
          }
        }
        return this.mediaStreamDest.stream;
      } catch (err) {
        console.warn('Could not create MediaStreamDestination', err);
      }
    }
    return null;
  }

  // Set Stem Isolation Mode
  public setStemMode(mode: StemMode) {
    this.stemMode = mode;
    this.updateStemRouting();
    this.notify();
  }

  public getStemMode(): StemMode {
    return this.stemMode;
  }

  // Set Swapped Instrumental (Afrobeat, Amapiano, Gqom, etc.)
  public setSwappedInstrumental(style: string) {
    this.swappedInstrumental = style;
    if (style !== 'none') {
      this.stemMode = 'swapped_instrumental';
    }
    if (this.isPlaying) {
      // Re-setup graph with new instrumental
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
  }

  public getSwappedInstrumental(): string {
    return this.swappedInstrumental;
  }

  // Set Stem Levels (Vocals / Beat / Swapped Instrumental / Bass)
  public setStemLevels(levels: Partial<StemMixLevels>) {
    this.stemMixLevels = { ...this.stemMixLevels, ...levels };
    this.updateStemRouting();
  }

  public getStemLevels(): StemMixLevels {
    return { ...this.stemMixLevels };
  }

  // Mute Original Words (Karaoke / Pure Instrumental Mode)
  public muteOriginalWords() {
    this.stemMode = 'words_muted';
    this.stemMixLevels.vocals = 0.0;
    this.stemMixLevels.beat = 1.0;
    this.updateStemRouting();
    this.notify();
  }

  // Mute Original Beat (Words Only / Acapella Mode)
  public muteOriginalBeat() {
    this.stemMode = 'words_only';
    this.stemMixLevels.vocals = 1.15;
    this.stemMixLevels.beat = 0.0;
    this.updateStemRouting();
    this.notify();
  }

  // Restore Full Original Mix
  public restoreFullMix() {
    this.stemMode = 'full';
    this.stemMixLevels.vocals = 1.0;
    this.stemMixLevels.beat = 1.0;
    this.swappedInstrumental = 'none';
    this.updateStemRouting();
    this.notify();
  }

  // Change Music Style to any genre (Afrobeat, Amapiano, Southern Trap, UK Drill, etc.)
  public changeMusicStyle(styleId: string, options: { muteOriginalBeat?: boolean; muteOriginalWords?: boolean } = {}) {
    this.swappedInstrumental = styleId;
    this.stemMode = 'swapped_instrumental';
    const muteBeat = options.muteOriginalBeat ?? true;
    const muteWords = options.muteOriginalWords ?? false;
    this.stemMixLevels.beat = muteBeat ? 0.0 : 0.8;
    this.stemMixLevels.vocals = muteWords ? 0.0 : 1.1;
    this.stemMixLevels.swappedInstrumental = 1.05;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
  }

  private updateStemRouting() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const isWordsOnly = this.stemMode === 'words_only';
    const isWordsMuted = this.stemMode === 'words_muted' || this.stemMode === 'beat_only' || this.stemMixLevels.vocals === 0;
    const isSwapped = this.stemMode === 'swapped_instrumental' && this.swappedInstrumental !== 'none';

    // Vocal Gain (Singing words & lyrics)
    if (this.vocalGain) {
      const vVol = isWordsMuted ? 0.0 : this.stemMixLevels.vocals;
      this.vocalGain.gain.setValueAtTime(vVol, now);
    }

    // Beat Gain (Original Track's Instrumental backing)
    if (this.beatGain) {
      const bVol = (isWordsOnly || isSwapped) ? 0.0 : this.stemMixLevels.beat;
      this.beatGain.gain.setValueAtTime(bVol, now);
    }

    // Swapped Instrumental Gain (New AI Style Beat)
    if (this.instrumentalGainNode) {
      const sVol = isSwapped ? this.stemMixLevels.swappedInstrumental : 0.0;
      this.instrumentalGainNode.gain.setValueAtTime(sVol, now);
    }

    // Frequency filter adaptations for words-only isolation
    if (this.vocalBandFilter && this.speechPeakingFilter) {
      if (isWordsOnly) {
        // High-pass above 190Hz to kill kicks + low-pass below 7.5kHz
        this.vocalBandFilter.frequency.setValueAtTime(190, now);
        this.speechPeakingFilter.gain.setValueAtTime(6.5, now); // boost vocal formants
      } else {
        this.vocalBandFilter.frequency.setValueAtTime(30, now);
        this.speechPeakingFilter.gain.setValueAtTime(0, now);
      }
    }
  }

  // Generate Procedural African Instrumental Loop
  public getOrCreateInstrumentalBuffer(style: string): AudioBuffer {
    this.initContext();
    const ctx = this.ctx!;
    if (this.instrumentalBufferMap.has(style)) {
      return this.instrumentalBufferMap.get(style)!;
    }

    const sampleRate = ctx.sampleRate;
    const bpm = style === 'afrobeat_lagos' ? 112 
      : style === 'amapiano_logdrum' ? 113 
      : style === 'southern_gqom' ? 127 
      : style === 'soukous_sebene' ? 130 
      : style === 'bongo_flava' ? 104 
      : style === 'south_african_3step' ? 118 
      : style === 'southern_trap' ? 140
      : style === 'uk_drill' ? 142 : 112;

    const beatInterval = 60 / bpm;
    const duration = beatInterval * 16; // 16 beats loop
    const buffer = ctx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < left.length; i++) {
      const t = i / sampleRate;
      const beat = (t / beatInterval) % 16;
      const beatFrac = t % beatInterval;

      let l = 0;
      let r = 0;

      if (style === 'afrobeat_lagos') {
        // --- AFROBEAT LAGOS GROOVE ---
        // Syncopated kick on beat 0, 1.5, 3
        const kickHits = [0, 1.5, 3, 4, 5.5, 7, 8, 9.5, 11, 12, 13.5, 15];
        const currentBeatIndex = Math.floor(beat * 2) / 2;
        const kickDist = Math.abs(beat - currentBeatIndex) * beatInterval;
        if (kickHits.includes(currentBeatIndex) && kickDist < 0.18) {
          const kFreq = 110 * Math.exp(-kickDist * 35) + 48;
          const k = Math.sin(2 * Math.PI * kFreq * kickDist) * Math.exp(-kickDist * 14) * 0.35;
          l += k;
          r += k;
        }

        // 16th-note Shaker with African syncopation
        const shaker16th = (t % (beatInterval / 4));
        if (shaker16th < 0.04) {
          const isAccent = Math.floor((t / (beatInterval / 4))) % 4 === 2;
          const shakerNoise = (Math.random() * 2 - 1) * Math.exp(-shaker16th * 90) * (isAccent ? 0.08 : 0.035);
          l += shakerNoise * 0.8;
          r += shakerNoise * 1.2;
        }

        // Rimshot / Woodblock on beats 2 & 4
        const rimT = (beat % 2);
        if (rimT < 0.06 && Math.floor(beat) % 2 === 1) {
          const rim = Math.sin(2 * Math.PI * 480 * rimT) * Math.exp(-rimT * 45) * 0.22;
          l += rim * 1.1;
          r += rim * 0.9;
        }

        // Kalimba Pluck Melody (Dorian / Pentatonic Afro scale: F#4, A4, B4, C#5, E5)
        const kalimbaNotes = [740, 880, 987, 1108, 1318, 987];
        const kNote = kalimbaNotes[Math.floor(beat * 2) % kalimbaNotes.length];
        const kSubT = (t % (beatInterval / 2));
        if (kSubT < 0.12) {
          const kTone = (Math.sin(2 * Math.PI * kNote * t) + 0.3 * Math.sin(2 * Math.PI * kNote * 2.75 * t)) * Math.exp(-kSubT * 12) * 0.07;
          l += kTone * 0.7;
          r += kTone * 1.3;
        }

        // Afro Brass Horn Stabs on 16th offbeats (bar 1 & 3)
        if (Math.floor(beat) % 4 === 3 && beatFrac > 0.25 && beatFrac < 0.45) {
          const hornT = beatFrac - 0.25;
          const horn1 = Math.sin(2 * Math.PI * 440 * hornT);
          const horn2 = Math.sin(2 * Math.PI * 554 * hornT);
          const horn = (horn1 + horn2) * Math.exp(-hornT * 8) * 0.09;
          l += horn * 1.1;
          r += horn * 1.1;
        }

        // Bouncy Warm Bassline
        const bassNotes = [110, 110, 146.8, 164.8, 110, 130.8];
        const bNote = bassNotes[Math.floor(beat) % bassNotes.length];
        const bass = Math.sin(2 * Math.PI * bNote * t) * 0.18;
        l += bass;
        r += bass;

      } else if (style === 'amapiano_logdrum') {
        // --- AMAPIANO LOG DRUM GROOVE ---
        // Signature South African FM Log Drum Pitch Sweep
        const logHits = [0, 1.75, 2.5, 4, 5.75, 6.5, 8, 9.75, 10.5, 12, 13.75, 14.5];
        const subBeatIndex = Math.floor(beat * 4) / 4;
        const logDist = Math.abs(beat - subBeatIndex) * beatInterval;
        if (logHits.includes(subBeatIndex) && logDist < 0.22) {
          // FM Log Drum sweep from 120Hz down to 42Hz with punchy transient
          const fmFreq = 120 * Math.exp(-logDist * 28) + 42;
          const mod = Math.sin(2 * Math.PI * fmFreq * 1.8 * logDist) * 1.5;
          const logSample = Math.sin(2 * Math.PI * fmFreq * logDist + mod) * Math.exp(-logDist * 8) * 0.42;
          l += logSample;
          r += logSample;
        }

        // Soulful Jazz Rhodes Chords (F#m9 - Bm7)
        const chordNotes = Math.floor(beat / 4) % 2 === 0 
          ? [370.0, 440.0, 554.3, 659.2] // F#m9
          : [493.8, 587.3, 740.0, 880.0]; // Bm7
        let rhodes = 0;
        for (const f of chordNotes) {
          rhodes += Math.sin(2 * Math.PI * f * t) * 0.035;
        }
        l += rhodes * 1.2;
        r += rhodes * 0.8;

        // Bacardi Swing Shakers
        const bacardiT = (t % (beatInterval / 4));
        if (bacardiT < 0.035) {
          const bShaker = (Math.random() * 2 - 1) * Math.exp(-bacardiT * 110) * 0.05;
          l += bShaker * 0.6;
          r += bShaker * 1.4;
        }

        // Soft Clap on beats 2 & 4
        if (Math.floor(beat) % 2 === 1 && beatFrac < 0.08) {
          const clap = (Math.random() * 2 - 1) * Math.exp(-beatFrac * 40) * 0.15;
          l += clap;
          r += clap;
        }

      } else if (style === 'southern_gqom') {
        // --- DURBAN GQOM HEAVY BEAT (127 BPM) ---
        // Heavy 4x4 Kick with distorted sub rumble
        if (beatFrac < 0.2) {
          const kFreq = 140 * Math.exp(-beatFrac * 30) + 40;
          const gqomKick = Math.sin(2 * Math.PI * kFreq * beatFrac) * Math.exp(-beatFrac * 10) * 0.45;
          l += gqomKick;
          r += gqomKick;
        }

        // Zulu Woodblock hollow tom sweeps
        if (beat % 4 > 2.5 && beat % 4 < 2.8) {
          const tomT = (beat % 4) - 2.5;
          const tom = Math.sin(2 * Math.PI * 220 * tomT) * Math.exp(-tomT * 25) * 0.25;
          l += tom * 1.2;
          r += tom * 0.8;
        }

        // Dark sub drone
        const sub = Math.sin(2 * Math.PI * 45 * t) * 0.18;
        l += sub;
        r += sub;

      } else if (style === 'soukous_sebene') {
        // --- CONGOLESE SOUKOUS SEBENE ---
        // Fast fingerpicking high guitar arpeggio
        const guitarNotes = [659.2, 783.9, 987.7, 1174.6, 987.7, 783.9];
        const gNote = guitarNotes[Math.floor(beat * 4) % guitarNotes.length];
        const gT = (t % (beatInterval / 4));
        if (gT < 0.08) {
          const g = (Math.sin(2 * Math.PI * gNote * t) + 0.4 * Math.sin(2 * Math.PI * gNote * 2 * t)) * Math.exp(-gT * 18) * 0.09;
          l += g * 0.8;
          r += g * 1.2;
        }

        // Fast hi-hat & syncopated snare rolls
        const hatT = (t % (beatInterval / 4));
        if (hatT < 0.025) {
          const h = (Math.random() * 2 - 1) * 0.04;
          l += h;
          r += h;
        }

      } else if (style === 'southern_trap') {
        // --- SOUTHERN TRAP & DIRTY SOUTH (140 BPM) ---
        // Crushing 808 sub kick on beats 0, 1.5, 3
        const is808 = (beat % 4 < 0.22) || (beat % 4 > 1.45 && beat % 4 < 1.7) || (beat % 4 > 2.95 && beat % 4 < 3.2);
        if (is808) {
          const tSub = (beat % 4 < 0.22 ? beat % 4 : beat % 4 > 1.45 && beat % 4 < 1.7 ? (beat % 4) - 1.5 : (beat % 4) - 3) * beatInterval;
          if (tSub >= 0 && tSub < 0.25) {
            const f808 = 95 * Math.exp(-tSub * 22) + 38;
            const sub = Math.sin(2 * Math.PI * f808 * tSub) * Math.exp(-tSub * 6) * 0.48;
            l += sub;
            r += sub;
          }
        }
        // Snappy Trap Clap on beat 2 of each 4
        if (Math.floor(beat) % 4 === 2 && beatFrac < 0.12) {
          const clap = (Math.random() * 2 - 1) * Math.exp(-beatFrac * 45) * 0.24;
          l += clap * 0.9;
          r += clap * 1.1;
        }
        // Triplet Trap Hi-Hats
        const tripletHat = (t % (beatInterval / 6));
        if (tripletHat < 0.02) {
          const h = (Math.random() * 2 - 1) * Math.exp(-tripletHat * 120) * 0.055;
          l += h * 0.7;
          r += h * 1.3;
        }

      } else if (style === 'uk_drill') {
        // --- UK DRILL 808 GLIDE (142 BPM) ---
        // Pitch-sliding 808 glide
        const drillSub = (beat % 4);
        if (drillSub < 0.35) {
          const glideFreq = 110 - drillSub * 140;
          const d808 = Math.sin(2 * Math.PI * Math.max(36, glideFreq) * t) * 0.44;
          l += d808;
          r += d808;
        }
        // Off-beat counter snare on beat 3.5
        if (beat % 4 > 3.45 && beat % 4 < 3.65) {
          const sn = (Math.random() * 2 - 1) * 0.22;
          l += sn;
          r += sn;
        }

      } else {
        // Default Afro-pop rhythmic backing
        if (beatFrac < 0.18) {
          const k = Math.sin(2 * Math.PI * 85 * beatFrac) * Math.exp(-beatFrac * 14) * 0.3;
          l += k;
          r += k;
        }
      }

      left[i] = Math.max(-0.95, Math.min(0.95, l));
      right[i] = Math.max(-0.95, Math.min(0.95, r));
    }

    this.instrumentalBufferMap.set(style, buffer);
    return buffer;
  }

  // Generate synthetic high-quality demo track (Afrobeat Fusion / Amapiano / Synthwave / Lo-fi)
  public async loadSyntheticTrack(presetName: 'midnight_drive' | 'cyber_trap' | 'lofi_rain' | 'viral_afro_fusion' | 'afrobeat_lagos' | 'amapiano_logdrum' | string): Promise<AudioBuffer> {
    this.initContext();
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 28; // 28 seconds seamless loop
    const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (presetName === 'viral_afro_fusion' || presetName === 'afrobeat_lagos' || presetName === 'papaoutai_afro_remix') {
      // --- VIRAL LAGOS AFROBEAT FUSION ANTHEM ---
      // 114 BPM Syncopated Lagos Afrobeat Groove + Melodic Vocal Hook
      const bpm = 114;
      const beatInterval = 60 / bpm;

      // Universal Afro-Pop Pentatonic Vocal Hook melody notes:
      const vocalMelody = [
        440.0, 493.8, 554.3, 659.2, 554.3, 493.8, 440.0, 0,
        440.0, 554.3, 659.2, 740.0, 659.2, 554.3, 493.8, 0,
        659.2, 554.3, 493.8, 440.0, 370.0, 440.0, 0, 0,
        659.2, 554.3, 493.8, 440.0, 493.8, 554.3, 440.0, 0
      ];

      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const beat = (t / beatInterval) % 32;
        const noteIdx = Math.floor(beat) % vocalMelody.length;
        const targetPitch = vocalMelody[noteIdx];

        // 1. Synthesized Vocal Words & Formants (Stromae French vocal hook timbre)
        let vocalWords = 0;
        if (targetPitch > 0) {
          const noteT = (t % beatInterval);
          // Human vocal formant synthesis (vowel filters / harmonics)
          const f1 = Math.sin(2 * Math.PI * targetPitch * t);
          const f2 = Math.sin(2 * Math.PI * targetPitch * 2.02 * t) * 0.45; // vowel formant
          const f3 = Math.sin(2 * Math.PI * targetPitch * 3.01 * t) * 0.25; // nasal formant
          const env = Math.min(1, noteT * 25) * Math.exp(-noteT * 2.2);
          vocalWords = (f1 + f2 + f3) * env * 0.22;
        }

        // 2. Afrobeat Lagos Drums: Syncopated kick on beats 0, 1.5, 3
        const subBeat = beat % 4;
        let kick = 0;
        if (subBeat < 0.18 || (subBeat > 1.48 && subBeat < 1.68) || (subBeat > 2.98 && subBeat < 3.18)) {
          const kickT = (subBeat < 0.18 ? subBeat : subBeat > 1.48 && subBeat < 1.68 ? subBeat - 1.5 : subBeat - 3) * beatInterval;
          if (kickT >= 0 && kickT < 0.18) {
            const kf = 115 * Math.exp(-kickT * 32) + 48;
            kick = Math.sin(2 * Math.PI * kf * kickT) * Math.exp(-kickT * 12) * 0.38;
          }
        }

        // 3. Shaker 16th-note Afrobeat swing
        const shakerT = (t % (beatInterval / 4));
        let shaker = 0;
        if (shakerT < 0.04) {
          shaker = (Math.random() * 2 - 1) * Math.exp(-shakerT * 85) * 0.045;
        }

        // 4. Afrobeat Brass Horn Stabs
        let horn = 0;
        if (Math.floor(beat) % 4 === 3 && (t % beatInterval) > 0.25 && (t % beatInterval) < 0.45) {
          const hT = (t % beatInterval) - 0.25;
          horn = (Math.sin(2 * Math.PI * 440 * hT) + Math.sin(2 * Math.PI * 554.3 * hT)) * Math.exp(-hT * 8) * 0.09;
        }

        // 5. Talking Drum / Kalimba plucks
        const kalimbaT = (t % (beatInterval / 2));
        let kalimba = 0;
        if (kalimbaT < 0.1) {
          const kNotes = [740, 880, 1108, 987];
          const kFreq = kNotes[Math.floor(beat * 2) % kNotes.length];
          kalimba = Math.sin(2 * Math.PI * kFreq * t) * Math.exp(-kalimbaT * 14) * 0.06;
        }

        // 6. Syncopated Bouncy Bassline
        const bassFreq = targetPitch > 0 ? targetPitch / 4 : 92.5;
        const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.19;

        const totalL = vocalWords * 1.0 + kick + shaker * 0.8 + horn * 1.1 + kalimba * 0.7 + bass;
        const totalR = vocalWords * 1.0 + kick + shaker * 1.2 + horn * 0.9 + kalimba * 1.3 + bass;

        left[i] = Math.max(-0.95, Math.min(0.95, totalL));
        right[i] = Math.max(-0.95, Math.min(0.95, totalR));
      }

    } else if (presetName === 'amapiano_logdrum') {
      // --- AMAPIANO LOG DRUM DEMO TRACK ---
      const bpm = 113;
      const beatInterval = 60 / bpm;
      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const beat = (t / beatInterval) % 16;
        const subBeatIndex = Math.floor(beat * 4) / 4;
        const logDist = Math.abs(beat - subBeatIndex) * beatInterval;

        let log = 0;
        const logHits = [0, 1.75, 2.5, 4, 5.75, 6.5, 8, 9.75, 10.5, 12, 13.75, 14.5];
        if (logHits.includes(subBeatIndex) && logDist < 0.22) {
          const fmFreq = 120 * Math.exp(-logDist * 28) + 42;
          const mod = Math.sin(2 * Math.PI * fmFreq * 1.8 * logDist) * 1.5;
          log = Math.sin(2 * Math.PI * fmFreq * logDist + mod) * Math.exp(-logDist * 8) * 0.42;
        }

        // Soft jazz Rhodes
        const chords = [[370, 440, 554, 659], [493, 587, 740, 880]];
        const ch = chords[Math.floor(beat / 4) % 2];
        let rhodes = 0;
        for (const f of ch) {
          rhodes += Math.sin(2 * Math.PI * f * t) * 0.03;
        }

        const sT = (t % (beatInterval / 4));
        const shaker = sT < 0.03 ? (Math.random() * 2 - 1) * Math.exp(-sT * 100) * 0.04 : 0;

        left[i] = Math.max(-0.95, Math.min(0.95, log + rhodes + shaker));
        right[i] = Math.max(-0.95, Math.min(0.95, log + rhodes + shaker));
      }

    } else {
      // Default Synthwave / Lo-Fi
      const bpm = presetName === 'midnight_drive' ? 104 : presetName === 'cyber_trap' ? 138 : 84;
      const beatInterval = 60 / bpm;
      const chordsA = [
        [220.0, 261.63, 329.63, 392.0],
        [174.61, 220.0, 261.63, 329.63],
        [261.63, 329.63, 392.0, 493.88],
        [196.0, 246.94, 293.66, 349.23],
      ];

      for (let i = 0; i < left.length; i++) {
        const t = i / sampleRate;
        const beat = (t / beatInterval) % 16;
        const bar = Math.floor(beat / 4);
        const chord = chordsA[bar % 4];

        let pad = 0;
        for (let c = 0; c < chord.length; c++) {
          const freq = chord[c];
          pad += Math.sin(2 * Math.PI * freq * t) * 0.04;
          pad += Math.sin(2 * Math.PI * freq * 1.002 * t + 0.3) * 0.02;
        }

        const rootFreq = chord[0] / 2;
        const bassEnv = Math.exp(-((t % beatInterval) * 4));
        const bass = Math.sin(2 * Math.PI * rootFreq * t) * 0.18 * Math.min(1, bassEnv + 0.3);

        const kickT = (t % beatInterval);
        let kick = 0;
        if (kickT < 0.25) {
          const kickPitch = 120 * Math.exp(-kickT * 35) + 45;
          kick = Math.sin(2 * Math.PI * kickPitch * kickT) * Math.exp(-kickT * 12) * 0.32;
        }

        const snareT = (t % (beatInterval * 2)) - beatInterval;
        let snare = 0;
        if (snareT > 0 && snareT < 0.2) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-snareT * 22) * 0.2;
          const tone = Math.sin(2 * Math.PI * 190 * snareT) * Math.exp(-snareT * 30) * 0.12;
          snare = noise + tone;
        }

        const hatT = (t % (beatInterval / 2));
        let hat = 0;
        if (hatT < 0.05) {
          hat = (Math.random() * 2 - 1) * Math.exp(-hatT * 80) * 0.06;
        }

        const melodyNotes = [659.25, 587.33, 523.25, 440.0, 659.25, 783.99];
        const melodyNote = melodyNotes[Math.floor((t * 2) % melodyNotes.length)];
        const pluckT = (t % 0.5);
        const pluck = Math.sin(2 * Math.PI * melodyNote * t) * Math.exp(-pluckT * 7) * 0.05;

        const totalL = pad + bass + kick + snare * 0.9 + hat * 0.8 + pluck * 1.1;
        const totalR = pad + bass + kick + snare * 1.1 + hat * 1.2 + pluck * 0.9;

        left[i] = Math.max(-0.95, Math.min(0.95, totalL));
        right[i] = Math.max(-0.95, Math.min(0.95, totalR));
      }
    }

    this.currentBuffer = buffer;
    this.pauseOffset = 0;
    this.notify();
    return buffer;
  }

  // Live Drum Sound Trigger (For on-screen pads & step sequencer like FL Studio/Ableton)
  public triggerDrumSound(sound: 'kick' | 'snare' | 'hihat' | 'shaker' | 'logdrum' | 'kalimba' | 'horn', velocity: number = 1.0) {
    this.initContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const masterDest = this.masterGain || ctx.destination;

    if (sound === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);
      gain.gain.setValueAtTime(0.8 * velocity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(masterDest);
      osc.start(now);
      osc.stop(now + 0.26);

    } else if (sound === 'logdrum') {
      // South African Amapiano FM Log Drum
      const carrier = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const gain = ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(125, now);
      carrier.frequency.exponentialRampToValueAtTime(38, now + 0.3);

      mod.type = 'sine';
      mod.frequency.setValueAtTime(125 * 1.75, now);
      modGain.gain.setValueAtTime(350, now);
      modGain.gain.exponentialRampToValueAtTime(10, now + 0.28);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);

      gain.gain.setValueAtTime(0.9 * velocity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      carrier.connect(gain);
      gain.connect(masterDest);

      carrier.start(now);
      mod.start(now);
      carrier.stop(now + 0.4);
      mod.stop(now + 0.4);

    } else if (sound === 'snare') {
      // Noise + tone
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.6 * velocity, now);
      src.connect(g);
      g.connect(masterDest);
      src.start(now);

    } else if (sound === 'hihat') {
      const len = Math.floor(ctx.sampleRate * 0.05);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(7000, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5 * velocity, now);
      src.connect(f);
      f.connect(g);
      g.connect(masterDest);
      src.start(now);

    } else if (sound === 'shaker') {
      const len = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(5500, now);
      f.Q.setValueAtTime(2.0, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4 * velocity, now);
      src.connect(f);
      f.connect(g);
      g.connect(masterDest);
      src.start(now);

    } else if (sound === 'kalimba') {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880 * 2.75, now);
      gain.gain.setValueAtTime(0.45 * velocity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(masterDest);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.46);
      osc2.stop(now + 0.46);

    } else if (sound === 'horn') {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.0, now);
      gain.gain.setValueAtTime(0.35 * velocity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterDest);
      osc.start(now);
      osc.stop(now + 0.36);
    }
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
      const decay = Math.pow(1 - n, 3);
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    return impulse;
  }

  // Build the complete DSP graph with Real-time Stem Separation and Swapped Instrumental Mixer
  private setupDSPGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clean up previous nodes
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch { /* ignore */ }
      this.sourceNode.disconnect();
    }
    if (this.instrumentalSourceNode) {
      try { this.instrumentalSourceNode.stop(); } catch { /* ignore */ }
      this.instrumentalSourceNode.disconnect();
    }

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    this.sourceNode.loop = true;

    // 1. Playback rate (Speed & Pitch)
    const effectiveSpeed = this.isOriginalMode ? 1.0 : this.currentSettings.speed;
    this.sourceNode.playbackRate.value = Math.max(0.3, Math.min(2.0, effectiveSpeed));

    // 2. Vocal & Speech isolation filters
    this.vocalBandFilter = ctx.createBiquadFilter();
    this.vocalBandFilter.type = 'highpass';
    this.vocalBandFilter.frequency.value = this.stemMode === 'words_only' ? 190 : 30;

    this.speechPeakingFilter = ctx.createBiquadFilter();
    this.speechPeakingFilter.type = 'peaking';
    this.speechPeakingFilter.frequency.value = 2800;
    this.speechPeakingFilter.gain.value = this.stemMode === 'words_only' ? 6.5 : 0;

    // 3. Bass Boost Filter (Low Shelf at 95Hz)
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 95;
    this.bassFilter.gain.value = this.isOriginalMode ? 0 : this.currentSettings.bassBoost;

    // 4. Lo-Fi / High-shelf cutoff
    this.lofiFilter = ctx.createBiquadFilter();
    this.lofiFilter.type = 'lowpass';
    this.lofiFilter.frequency.value = this.isOriginalMode ? 20000 : (this.currentSettings.lofiCutoff || 20000);

    // 5. Stem Faders (Vocals Gain & Beat Gain)
    this.vocalGain = ctx.createGain();
    this.beatGain = ctx.createGain();
    const isWordsOnly = this.stemMode === 'words_only';
    const isWordsMuted = this.stemMode === 'words_muted' || this.stemMode === 'beat_only' || this.stemMixLevels.vocals === 0;
    const isSwapped = this.stemMode === 'swapped_instrumental' && this.swappedInstrumental !== 'none';
    this.vocalGain.gain.value = isWordsMuted ? 0.0 : this.stemMixLevels.vocals;
    this.beatGain.gain.value = (isWordsOnly || isSwapped) ? 0.0 : this.stemMixLevels.beat;

    // 6. Reverb Convolver & Dry/Wet Mixer
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.createImpulseResponse(this.isOriginalMode ? 0.5 : this.currentSettings.reverbDecay);

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    const wetVal = this.isOriginalMode ? 0.0 : Math.max(0, Math.min(0.9, this.currentSettings.reverbWet));
    this.wetGain.gain.value = wetVal;
    this.dryGain.gain.value = Math.max(0.1, 1.0 - wetVal * 0.6);

    // 7. 8D Binaural Stereo Panner
    this.panner8D = ctx.createStereoPanner();
    this.panner8D.pan.value = 0;
    this.is8DEnabled = !this.isOriginalMode && Boolean(this.currentSettings.pan8d);
    this.panSpeed = this.currentSettings.panSpeed || 0.1;

    // 8. Compressor / Limiter
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 9. Analyser Node (for real-time visualizers)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // 10. Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.95;

    // --- WIRING MAIN TRACK ---
    this.sourceNode.connect(this.vocalBandFilter);
    this.vocalBandFilter.connect(this.speechPeakingFilter);
    this.speechPeakingFilter.connect(this.vocalGain);

    this.sourceNode.connect(this.bassFilter);
    this.bassFilter.connect(this.beatGain);

    const mixerSum = ctx.createGain();
    this.vocalGain.connect(mixerSum);
    this.beatGain.connect(mixerSum);

    mixerSum.connect(this.lofiFilter);

    // Dry & Wet paths
    this.lofiFilter.connect(this.dryGain);
    this.dryGain.connect(this.panner8D);

    this.lofiFilter.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.panner8D);

    this.panner8D.connect(this.compressor);

    // --- SECONDARY SOURCE: SWAPPED INSTRUMENTAL (AFROBEAT / AMAPIANO / GQOM) ---
    const swapStyle = this.currentSettings.instrumentalSwap || this.swappedInstrumental;
    if (swapStyle && swapStyle !== 'none' && this.stemMode === 'swapped_instrumental') {
      const instBuffer = this.getOrCreateInstrumentalBuffer(swapStyle);
      this.instrumentalSourceNode = ctx.createBufferSource();
      this.instrumentalSourceNode.buffer = instBuffer;
      this.instrumentalSourceNode.loop = true;

      this.instrumentalGainNode = ctx.createGain();
      this.instrumentalGainNode.gain.value = this.stemMixLevels.swappedInstrumental;

      this.instrumentalSourceNode.connect(this.instrumentalGainNode);
      this.instrumentalGainNode.connect(this.compressor);
    }

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
      console.warn('MediaStreamDestination notice:', err);
    }

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

    if (this.instrumentalSourceNode) {
      const instBuffer = this.instrumentalSourceNode.buffer;
      const instOffset = instBuffer ? (this.pauseOffset % instBuffer.duration) : 0;
      try {
        this.instrumentalSourceNode.start(0, instOffset);
      } catch (err) {
        console.warn('Instrumental start err', err);
      }
    }

    this.startTime = this.ctx!.currentTime - (offset / (this.isOriginalMode ? 1.0 : this.currentSettings.speed));
    this.isPlaying = true;

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
    try {
      this.instrumentalSourceNode?.stop();
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
    if (preset.stemMode) {
      this.stemMode = preset.stemMode;
    }
    if (preset.instrumentalSwap) {
      this.swappedInstrumental = preset.instrumentalSwap;
    }

    if (this.isPlaying) {
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
      this.updateStemRouting();
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

  // A/B Comparison Toggle
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

  // Extract isolated vocal words buffer (Neural-style mid-channel + vocal bandpass)
  private extractVocalBuffer(input: AudioBuffer, ctx: BaseAudioContext): AudioBuffer {
    const numChan = input.numberOfChannels;
    const len = input.length;
    const rate = input.sampleRate;
    const vocalBuf = ctx.createBuffer(2, len, rate);
    const vL = vocalBuf.getChannelData(0);
    const vR = vocalBuf.getChannelData(1);

    const inL = input.getChannelData(0);
    const inR = numChan > 1 ? input.getChannelData(1) : inL;

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

  // Export Offline Rendered High-Quality WAV with stem isolation or swapped African remix
  public async renderAndExportWAV(options: { 
    stemType?: 'master' | 'vocals' | 'instrumental' | 'swapped_remix';
    instrumentalStyle?: string;
  } = {}): Promise<Blob> {
    if (!this.currentBuffer) throw new Error('No audio buffer loaded');

    const stemType = options.stemType || 'master';
    const swapStyle = options.instrumentalStyle || this.swappedInstrumental;
    const srcDuration = this.currentBuffer.duration;
    const speed = this.currentSettings.speed;
    const renderDuration = srcDuration / speed + (this.currentSettings.reverbDecay || 3);
    const sampleRate = 44100;
    const length = Math.ceil(renderDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    let sourceBuffer = this.currentBuffer;
    if (stemType === 'vocals') {
      sourceBuffer = this.extractVocalBuffer(this.currentBuffer, offlineCtx);
    } else if (stemType === 'instrumental') {
      sourceBuffer = this.extractInstrumentalBuffer(this.currentBuffer, offlineCtx);
    }

    const offlineSrc = offlineCtx.createBufferSource();
    offlineSrc.buffer = sourceBuffer;
    offlineSrc.playbackRate.value = speed;

    const bass = offlineCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 95;
    bass.gain.value = stemType === 'vocals' ? 0 : this.currentSettings.bassBoost;

    const lofi = offlineCtx.createBiquadFilter();
    lofi.type = 'lowpass';
    lofi.frequency.value = this.currentSettings.lofiCutoff || 20000;

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

    offlineSrc.connect(bass);
    bass.connect(lofi);
    lofi.connect(vocalFilter);

    vocalFilter.connect(dry);
    vocalFilter.connect(conv);
    conv.connect(wet);

    dry.connect(offlinePanner);
    wet.connect(offlinePanner);

    offlinePanner.connect(comp);

    // If swapped remix, add secondary instrumental loop to offline context
    if ((stemType === 'swapped_remix' || this.stemMode === 'swapped_instrumental') && swapStyle && swapStyle !== 'none') {
      const instBuf = this.getOrCreateInstrumentalBuffer(swapStyle);
      const offlineInst = offlineCtx.createBufferSource();
      offlineInst.buffer = instBuf;
      offlineInst.loop = true;
      const instGain = offlineCtx.createGain();
      instGain.gain.value = this.stemMixLevels.swappedInstrumental;
      offlineInst.connect(instGain);
      instGain.connect(comp);
      offlineInst.start(0);
    }

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

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);

    setUint32(0x61746164); // "data"
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
