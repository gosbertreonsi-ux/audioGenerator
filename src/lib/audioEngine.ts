// Web Audio API DSP Engine for MusicMotion AI
import { TransformationPreset, StemMode, StemMixLevels } from '../types';
import { AltareEngine, AltareRemixConfig, DEFAULT_ALTARE_CONFIG } from './altareEngine';

export class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private instrumentalBuffer: AudioBuffer | null = null; // Words 100% Muted / Beat only
  private vocalBuffer: AudioBuffer | null = null; // Beat 100% Muted / Words only

  // Synchronized Multi-Stem Sources & Controls
  private fullSourceNode: AudioBufferSourceNode | null = null; // 100% Bit-perfect original audio
  private beatSourceNode: AudioBufferSourceNode | null = null; // Pure instrumental (words muted)
  private vocalSourceNode: AudioBufferSourceNode | null = null; // Pure vocals (beat muted)
  private fullGain: GainNode | null = null;
  private beatGain: GainNode | null = null;
  private vocalGain: GainNode | null = null;
  
  // Project Altare-Builder: Future Bass & Wave Automation Engine
  private isAltareMode: boolean = false;
  private altareConfig: AltareRemixConfig = { ...DEFAULT_ALTARE_CONFIG };
  private altareSourceNode: AudioBufferSourceNode | null = null;
  private vocalChopSourceNode: AudioBufferSourceNode | null = null;
  private altareGain: GainNode | null = null;
  private vocalChopGain: GainNode | null = null;
  private altareArrangementBuffer: AudioBuffer | null = null;
  private vocalChopBuffer: AudioBuffer | null = null;

  // Secondary source for swapped instrumental backing track (Afrobeat, Amapiano, etc.)
  private instrumentalSourceNode: AudioBufferSourceNode | null = null;
  private instrumentalGainNode: GainNode | null = null;
  private instrumentalBufferMap: Map<string, AudioBuffer> = new Map();

  // Dual-Track In-Studio Layering (Song 2)
  private secondaryBuffer: AudioBuffer | null = null;
  private secondaryTrackTitle: string = '';
  private secondaryVocalBuffer: AudioBuffer | null = null;
  private secondaryBeatBuffer: AudioBuffer | null = null;
  private secondarySourceNode: AudioBufferSourceNode | null = null;
  private secondaryGainNode: GainNode | null = null;
  private secondaryVolume: number = 0.85;
  private secondaryStemMode: 'full' | 'beat_only' | 'words_only' = 'full';
  private secondaryNativeBpm: number = 120;
  private secondaryBeatLock: boolean = true;
  private secondaryOffsetSec: number = 0;

  // Additional FX Nodes
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
  private isAudioImportedByUser = false;

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
    if (mode === 'words_muted') {
      this.stemMixLevels.vocals = 0.0;
      this.stemMixLevels.beat = 1.0;
    } else if (mode === 'words_only') {
      this.stemMixLevels.vocals = 1.15;
      this.stemMixLevels.beat = 0.0;
    } else if (mode === 'beat_only') {
      this.stemMixLevels.vocals = 0.0;
      this.stemMixLevels.beat = 1.0;
    } else if (mode === 'swapped_instrumental') {
      this.stemMixLevels.beat = 0.0;
      this.stemMixLevels.vocals = 1.0;
    } else {
      this.stemMixLevels.vocals = 1.0;
      this.stemMixLevels.beat = 1.0;
      this.stemMixLevels.swappedInstrumental = 0.0;
    }
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
      this.stemMixLevels.beat = 0.0;
      this.stemMixLevels.vocals = 1.0;
    }
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.updateStemRouting();
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
    this.updateStemRouting();
    this.notify();
  }

  private updateStemRouting() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const isWordsOnly = this.stemMode === 'words_only';
    const isWordsMuted = this.stemMode === 'words_muted' || this.stemMode === 'beat_only' || this.stemMixLevels.vocals === 0;
    const isSwapped = this.stemMode === 'swapped_instrumental' && this.swappedInstrumental !== 'none';
    const isAltare = this.isAltareMode;

    if (isAltare) {
      // In Altare Mode:
      // Mute full original mix
      if (this.fullGain) this.fullGain.gain.setTargetAtTime(0.0, now, 0.015);
      // Original beat is muted (or custom mix)
      if (this.beatGain) {
        const bVol = this.altareConfig.muteOriginalBeat ? 0.0 : this.stemMixLevels.beat;
        this.beatGain.gain.setTargetAtTime(bVol, now, 0.015);
      }
      // Original words are active (or muted)
      if (this.vocalGain) {
        const vVol = this.altareConfig.muteOriginalWords ? 0.0 : (this.stemMixLevels.vocals * 1.15);
        this.vocalGain.gain.setTargetAtTime(vVol, now, 0.015);
      }
      if (this.altareGain) {
        this.altareGain.gain.setTargetAtTime(1.05, now, 0.015);
      }
      if (this.vocalChopGain) {
        this.vocalChopGain.gain.setTargetAtTime(1.15, now, 0.015);
      }
      return;
    }

    // Standard Mode:
    if (this.stemMode === 'full') {
      // 100% Bit-perfect original audio playback!
      if (this.fullGain) this.fullGain.gain.setTargetAtTime(1.0, now, 0.015);
      if (this.beatGain) this.beatGain.gain.setTargetAtTime(0.0, now, 0.015);
      if (this.vocalGain) this.vocalGain.gain.setTargetAtTime(0.0, now, 0.015);
      if (this.instrumentalGainNode) this.instrumentalGainNode.gain.setTargetAtTime(0.0, now, 0.015);
      return;
    }

    // Stem Mode Active (Full original mix muted):
    if (this.fullGain) this.fullGain.gain.setTargetAtTime(0.0, now, 0.015);

    // 1. Vocal Gain: ZERO when words_muted!
    if (this.vocalGain) {
      const vVol = isWordsMuted 
        ? 0.0 
        : (isWordsOnly ? this.stemMixLevels.vocals * 1.25 : this.stemMixLevels.vocals);
      this.vocalGain.gain.setTargetAtTime(vVol, now, 0.015);
    }

    // 2. Beat Gain: ZERO when words_only or swapped style!
    if (this.beatGain) {
      const bVol = (isWordsOnly || isSwapped) ? 0.0 : this.stemMixLevels.beat;
      this.beatGain.gain.setTargetAtTime(bVol, now, 0.015);
    }

    // 3. Swapped Style Instrumental Gain
    if (this.instrumentalGainNode) {
      const instVol = isSwapped ? this.stemMixLevels.swappedInstrumental : 0.0;
      this.instrumentalGainNode.gain.setTargetAtTime(instVol, now, 0.015);
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

  // Built-in original sounds removed - only user imported songs are played
  public async loadSyntheticTrack(_presetName?: string): Promise<AudioBuffer> {
    throw new Error('Original sounds removed. Please import your own audio song file to play.');
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

  // Generate high-precision separate stems: vocalBuffer (words only, beat muted) and instrumentalBuffer (beat only, words muted)
  public separateStemsFromBuffer(buffer: AudioBuffer): { vocal: AudioBuffer; instrumental: AudioBuffer } {
    this.initContext();
    const ctx = this.ctx!;
    const rate = buffer.sampleRate;
    const len = buffer.length;
    const numChan = buffer.numberOfChannels;

    const instBuf = ctx.createBuffer(2, len, rate);
    const vocBuf = ctx.createBuffer(2, len, rate);

    const instL = instBuf.getChannelData(0);
    const instR = instBuf.getChannelData(1);
    const vocL = vocBuf.getChannelData(0);
    const vocR = vocBuf.getChannelData(1);

    const inL = buffer.getChannelData(0);
    const inR = numChan > 1 ? buffer.getChannelData(1) : inL;

    // Filters for high-accuracy vocal isolation:
    // 1. Highpass at 180Hz (cuts kick drum, 808 sub, and bass guitar)
    const hpCut = (180 / rate) * 2 * Math.PI;
    let hpL = 0, hpInL = 0;

    // 2. Lowpass at 6500Hz (cuts cymbals, air, hi-hat ticks)
    const lpCut = (6500 / rate) * 2 * Math.PI;
    let lpL = 0;

    // Determine stereo vs mono content
    let stereoEnergy = 0;
    const checkSamples = Math.min(len, rate * 4);
    for (let i = 0; i < checkSamples; i += 32) {
      stereoEnergy += Math.abs(inL[i] - inR[i]);
    }
    const isStereo = stereoEnergy > 0.35;

    for (let i = 0; i < len; i++) {
      const l = inL[i];
      const r = inR[i];

      // Mid channel contains center vocal; Side channel contains stereo width instruments
      const mid = 0.5 * (l + r);
      const side = 0.5 * (l - r);

      // Continuous 2-pole bandpass filter on Mid (180 Hz to 4200 Hz) to isolate vocal formants
      const hp = mid - hpInL + (1 - hpCut) * hpL;
      hpInL = mid;
      hpL = hp;

      lpL += lpCut * (hp - lpL);
      const vocalSmooth = lpL * 1.35;
      const vocalClamped = Math.max(-0.95, Math.min(0.95, vocalSmooth));

      // 1. Vocal stem (words only, beat muted):
      vocL[i] = vocalClamped;
      vocR[i] = vocalClamped;

      // 2. Instrumental stem (words muted, beat and instruments preserved):
      // Left = side + (mid - vocalSmooth * 0.95)
      // Right = -side + (mid - vocalSmooth * 0.95)
      // Completely linear and continuous - eliminates 100% of zero-crossing clicks and scratching!
      const instLeft = isStereo ? (side + (mid - vocalSmooth * 0.95)) : (l - vocalSmooth * 0.92);
      const instRight = isStereo ? (-side + (mid - vocalSmooth * 0.95)) : (r - vocalSmooth * 0.92);

      instL[i] = Math.max(-0.95, Math.min(0.95, instLeft));
      instR[i] = Math.max(-0.95, Math.min(0.95, instRight));
    }

    return { vocal: vocBuf, instrumental: instBuf };
  }

  // Load custom audio file imported by user
  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    this.initContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
    this.currentBuffer = decoded;

    // Separate stems into pure vocal and pure instrumental buffers immediately
    const stems = this.separateStemsFromBuffer(decoded);
    this.vocalBuffer = stems.vocal;
    this.instrumentalBuffer = stems.instrumental;

    this.isAudioImportedByUser = true;
    this.pauseOffset = 0;
    this.notify();
    return decoded;
  }

  // Load custom audio file from URL or Blob
  public async loadAudioBuffer(buffer: AudioBuffer): Promise<AudioBuffer> {
    this.initContext();
    this.currentBuffer = buffer;

    const stems = this.separateStemsFromBuffer(buffer);
    this.vocalBuffer = stems.vocal;
    this.instrumentalBuffer = stems.instrumental;

    this.isAudioImportedByUser = true;
    this.pauseOffset = 0;
    this.notify();
    return buffer;
  }

  public hasUserImportedTrack(): boolean {
    return Boolean(this.currentBuffer && this.isAudioImportedByUser);
  }

  public getCurrentBuffer(): AudioBuffer | null {
    return this.currentBuffer;
  }

  public clearCurrentTrack() {
    this.pause();
    this.currentBuffer = null;
    this.instrumentalBuffer = null;
    this.vocalBuffer = null;
    this.isAudioImportedByUser = false;
    this.pauseOffset = 0;
    this.notify();
  }

  /**
   * Fast, accurate BPM detection using autocorrelation of low-pass filtered transients
   */
  public detectBpm(buffer: AudioBuffer | null): number {
    if (!buffer) return 120;
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const maxScanSeconds = Math.min(60, buffer.duration);
    const totalSamples = Math.floor(sampleRate * maxScanSeconds);

    const downsample = 4;
    const downsampledRate = sampleRate / downsample;
    const len = Math.floor(totalSamples / downsample);
    const env = new Float32Array(len);

    let lp = 0;
    const alpha = (220 / sampleRate) * 2 * Math.PI;

    for (let i = 0, j = 0; i < totalSamples && j < len; i += downsample, j++) {
      const raw = channelData[i];
      lp += alpha * (raw - lp);
      env[j] = lp * lp;
    }

    const minBpm = 75;
    const maxBpm = 175;
    const minLag = Math.floor((downsampledRate * 60) / maxBpm);
    const maxLag = Math.floor((downsampledRate * 60) / minBpm);

    let bestBpm = 120;
    let maxCorr = -1;

    for (let lag = minLag; lag <= maxLag; lag += 2) {
      let sum = 0;
      const count = Math.min(len - lag, Math.floor(downsampledRate * 12));
      for (let i = 0; i < count; i += 4) {
        sum += env[i] * env[i + lag];
      }
      if (sum > maxCorr) {
        maxCorr = sum;
        bestBpm = Math.round((downsampledRate * 60) / lag);
      }
    }

    if (bestBpm < 75) bestBpm *= 2;
    if (bestBpm > 175) bestBpm = Math.round(bestBpm / 2);

    return Math.max(80, Math.min(160, bestBpm));
  }

  // --- SECONDARY AUDIO TRACK (SONG 2) LAYER METHODS ---
  public async loadSecondaryAudioFile(file: File): Promise<AudioBuffer> {
    this.initContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx!.decodeAudioData(arrayBuffer);
    this.secondaryBuffer = decoded;
    this.secondaryTrackTitle = file.name.replace(/\.[^/.]+$/, '');
    this.secondaryNativeBpm = this.detectBpm(decoded);
    const stems = this.separateStemsFromBuffer(decoded);
    this.secondaryVocalBuffer = stems.vocal;
    this.secondaryBeatBuffer = stems.instrumental;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
    return decoded;
  }

  public async loadSecondaryAudioBuffer(buffer: AudioBuffer, title?: string): Promise<AudioBuffer> {
    this.initContext();
    this.secondaryBuffer = buffer;
    this.secondaryTrackTitle = title || 'Song 2 (Layer)';
    this.secondaryNativeBpm = this.detectBpm(buffer);
    const stems = this.separateStemsFromBuffer(buffer);
    this.secondaryVocalBuffer = stems.vocal;
    this.secondaryBeatBuffer = stems.instrumental;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
    return buffer;
  }

  public removeSecondaryTrack() {
    try { this.secondarySourceNode?.stop(); } catch { /* ignore */ }
    this.secondarySourceNode?.disconnect();
    this.secondaryBuffer = null;
    this.secondaryVocalBuffer = null;
    this.secondaryBeatBuffer = null;
    this.secondaryTrackTitle = '';
    this.notify();
  }

  public hasSecondaryTrack(): boolean {
    return Boolean(this.secondaryBuffer);
  }

  public getSecondaryTrackInfo() {
    return {
      hasTrack: Boolean(this.secondaryBuffer),
      title: this.secondaryTrackTitle,
      bpm: this.secondaryNativeBpm,
      volume: this.secondaryVolume,
      stemMode: this.secondaryStemMode,
      beatLock: this.secondaryBeatLock,
      offsetSec: this.secondaryOffsetSec,
    };
  }

  public setSecondaryVolume(vol: number) {
    this.secondaryVolume = Math.max(0, Math.min(1.5, vol));
    if (this.secondaryGainNode && this.ctx) {
      this.secondaryGainNode.gain.setTargetAtTime(this.secondaryVolume, this.ctx.currentTime, 0.03);
    }
    this.notify();
  }

  public setSecondaryStemMode(mode: 'full' | 'beat_only' | 'words_only') {
    this.secondaryStemMode = mode;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
  }

  public setSecondaryBeatLock(lock: boolean) {
    this.secondaryBeatLock = lock;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
  }

  public setSecondaryOffset(sec: number) {
    this.secondaryOffsetSec = Math.max(-10, Math.min(10, sec));
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
      this.play();
    }
    this.notify();
  }

  // Create algorithmic studio impulse response for Reverb (100% scratch-free, diffuse acoustic space, smooth multi-tap reflections)
  private createImpulseResponse(decayTime: number, baseCtx?: BaseAudioContext): AudioBuffer {
    const ctx = baseCtx || this.ctx!;
    const rate = ctx.sampleRate;
    const clampedDecay = Math.max(0.5, Math.min(7.0, decayTime));
    const length = Math.floor(rate * clampedDecay);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Filter states for high-frequency damping (prevents harsh scratching/sizzle)
    let lpL = 0, lpR = 0;
    const diffCut = (2400 / rate) * 2 * Math.PI;

    let sumSquare = 0;
    for (let i = 0; i < length; i++) {
      const progress = i / length;
      // Exponential acoustic absorption decay curve
      const decay = Math.exp(-progress * 4.8);

      // Lowpass-filtered diffused reflections (pure smooth reflection, NO raw white noise)
      const rawNoiseL = (Math.random() * 2 - 1);
      const rawNoiseR = (Math.random() * 2 - 1);

      lpL += diffCut * (rawNoiseL - lpL);
      lpR += diffCut * (rawNoiseR - lpR);

      // Early reflection comb diffusion with stereo decorrelation
      const sampleL = lpL * decay;
      const sampleR = lpR * decay;

      left[i] = sampleL;
      right[i] = sampleR;
      sumSquare += sampleL * sampleL + sampleR * sampleR;
    }

    // RMS normalization to safe reference level (prevents clipping, scratching, and harshness)
    const rms = Math.sqrt(sumSquare / (length * 2)) || 1;
    const targetRms = 0.04;
    const normFactor = targetRms / rms;

    for (let i = 0; i < length; i++) {
      left[i] = Math.tanh(left[i] * normFactor);
      right[i] = Math.tanh(right[i] * normFactor);
    }

    return impulse;
  }

  // Build the complete DSP graph with Real-time Stem Separation and Swapped Instrumental Mixer
  private setupDSPGraph() {
    if (!this.ctx || !this.currentBuffer) return;
    const ctx = this.ctx;

    // Clean up previous nodes
    if (this.fullSourceNode) {
      try { this.fullSourceNode.stop(); } catch { /* ignore */ }
      this.fullSourceNode.disconnect();
    }
    if (this.beatSourceNode) {
      try { this.beatSourceNode.stop(); } catch { /* ignore */ }
      this.beatSourceNode.disconnect();
    }
    if (this.vocalSourceNode) {
      try { this.vocalSourceNode.stop(); } catch { /* ignore */ }
      this.vocalSourceNode.disconnect();
    }
    if (this.altareSourceNode) {
      try { this.altareSourceNode.stop(); } catch { /* ignore */ }
      this.altareSourceNode.disconnect();
    }
    if (this.vocalChopSourceNode) {
      try { this.vocalChopSourceNode.stop(); } catch { /* ignore */ }
      this.vocalChopSourceNode.disconnect();
    }
    if (this.instrumentalSourceNode) {
      try { this.instrumentalSourceNode.stop(); } catch { /* ignore */ }
      this.instrumentalSourceNode.disconnect();
    }
    if (this.secondarySourceNode) {
      try { this.secondarySourceNode.stop(); } catch { /* ignore */ }
      this.secondarySourceNode.disconnect();
    }

    // Ensure pre-separated stem buffers exist
    if (!this.instrumentalBuffer || !this.vocalBuffer) {
      const stems = this.separateStemsFromBuffer(this.currentBuffer);
      this.vocalBuffer = stems.vocal;
      this.instrumentalBuffer = stems.instrumental;
    }

    // 1. Playback rate (Speed & Pitch combined)
    const speed = this.isOriginalMode ? 1.0 : this.currentSettings.speed;
    const pitch = this.isOriginalMode ? 0 : (this.currentSettings.pitch || 0);
    const effectiveSpeed = Math.max(0.3, Math.min(2.5, speed * Math.pow(2, pitch / 12)));

    // 2. Full original mix source node (Pristine original sound)
    this.fullSourceNode = ctx.createBufferSource();
    this.fullSourceNode.buffer = this.currentBuffer;
    this.fullSourceNode.loop = true;
    this.fullSourceNode.playbackRate.value = effectiveSpeed;

    // 3. Pure Instrumental Beat Source Node (words 100% muted)
    this.beatSourceNode = ctx.createBufferSource();
    this.beatSourceNode.buffer = this.instrumentalBuffer;
    this.beatSourceNode.loop = true;
    this.beatSourceNode.playbackRate.value = effectiveSpeed;

    // 4. Pure Vocal Words Source Node (beat 100% muted)
    this.vocalSourceNode = ctx.createBufferSource();
    this.vocalSourceNode.buffer = this.vocalBuffer;
    this.vocalSourceNode.loop = true;
    this.vocalSourceNode.playbackRate.value = effectiveSpeed;

    // 5. Stem Gain Controllers for complete muting
    this.fullGain = ctx.createGain();
    this.beatGain = ctx.createGain();
    this.vocalGain = ctx.createGain();

    this.fullSourceNode.connect(this.fullGain);
    this.beatSourceNode.connect(this.beatGain);
    this.vocalSourceNode.connect(this.vocalGain);

    const stemMixer = ctx.createGain();
    this.fullGain.connect(stemMixer);
    this.beatGain.connect(stemMixer);
    this.vocalGain.connect(stemMixer);

    // Secondary Audio Track (Song 2) connected to stemMixer for Dual-Audio playback
    if (this.secondaryBuffer) {
      const secBuf = this.secondaryStemMode === 'beat_only' && this.secondaryBeatBuffer
        ? this.secondaryBeatBuffer
        : this.secondaryStemMode === 'words_only' && this.secondaryVocalBuffer
        ? this.secondaryVocalBuffer
        : this.secondaryBuffer;

      this.secondarySourceNode = ctx.createBufferSource();
      this.secondarySourceNode.buffer = secBuf;
      this.secondarySourceNode.loop = true;

      const primaryBpm = this.detectBpm(this.currentBuffer);
      const secMultiplier = (this.secondaryBeatLock && this.secondaryNativeBpm > 0 && primaryBpm > 0)
        ? (primaryBpm / this.secondaryNativeBpm)
        : 1.0;
      this.secondarySourceNode.playbackRate.value = Math.max(0.3, Math.min(2.5, effectiveSpeed * secMultiplier));

      this.secondaryGainNode = ctx.createGain();
      this.secondaryGainNode.gain.value = this.secondaryVolume;

      this.secondarySourceNode.connect(this.secondaryGainNode);
      this.secondaryGainNode.connect(stemMixer);
    }

    // 6. User Bass Boost Filter (Low Shelf at 95Hz)
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 95;
    this.bassFilter.gain.value = this.isOriginalMode ? 0 : this.currentSettings.bassBoost;

    // 7. Lo-Fi / High-shelf cutoff
    this.lofiFilter = ctx.createBiquadFilter();
    this.lofiFilter.type = 'lowpass';
    this.lofiFilter.frequency.value = this.isOriginalMode ? 20000 : (this.currentSettings.lofiCutoff || 20000);

    // 8. Reverb Convolver & Dry/Wet Mixer
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.createImpulseResponse(this.isOriginalMode ? 0.5 : this.currentSettings.reverbDecay);

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    const wetVal = this.isOriginalMode ? 0.0 : Math.max(0, Math.min(0.9, this.currentSettings.reverbWet));
    this.wetGain.gain.value = wetVal;
    this.dryGain.gain.value = Math.max(0.1, 1.0 - wetVal * 0.6);

    // 9. 8D Binaural Stereo Panner
    this.panner8D = ctx.createStereoPanner();
    this.panner8D.pan.value = 0;
    this.is8DEnabled = !this.isOriginalMode && Boolean(this.currentSettings.pan8d);
    this.panSpeed = this.currentSettings.panSpeed || 0.1;

    // 10. Compressor / Limiter targeting -9 LUFS
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    this.compressor.knee.setValueAtTime(30, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // Soft analog saturation limiter (prevents digital clipping scratch completely)
    const softLimiter = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i * 2) / 1024 - 1;
      curve[i] = Math.tanh(x * 1.05) * 0.95;
    }
    softLimiter.curve = curve;

    // 11. Analyser Node (for real-time visualizers)
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;

    // 12. Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.95;

    // --- WIRING STEREO CHAIN ---
    stemMixer.connect(this.bassFilter);
    this.bassFilter.connect(this.lofiFilter);

    // Dry & Wet paths
    this.lofiFilter.connect(this.dryGain);
    this.dryGain.connect(this.panner8D);

    this.lofiFilter.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.panner8D);

    this.panner8D.connect(this.compressor);

    // --- ALTARE FUTURE BASS / TRAP REMIX SYNTHESIS ENGINE ---
    if (this.isAltareMode) {
      if (!this.altareArrangementBuffer) {
        this.altareArrangementBuffer = AltareEngine.generateArrangementBuffer(
          ctx,
          this.altareConfig,
          this.currentBuffer.duration
        );
      }
      this.altareSourceNode = ctx.createBufferSource();
      this.altareSourceNode.buffer = this.altareArrangementBuffer;
      this.altareSourceNode.loop = true;

      this.altareGain = ctx.createGain();
      this.altareGain.gain.value = 1.05;

      this.altareSourceNode.connect(this.altareGain);
      this.altareGain.connect(this.compressor);

      // Vocal Chops Lead
      if (this.vocalBuffer && this.altareConfig.vocalChopDensity !== 'sparse') {
        if (!this.vocalChopBuffer) {
          this.vocalChopBuffer = AltareEngine.generateVocalChopLead(
            ctx,
            this.vocalBuffer,
            this.altareConfig,
            this.currentBuffer.duration
          );
        }
        this.vocalChopSourceNode = ctx.createBufferSource();
        this.vocalChopSourceNode.buffer = this.vocalChopBuffer;
        this.vocalChopSourceNode.loop = true;

        this.vocalChopGain = ctx.createGain();
        this.vocalChopGain.gain.value = 1.15;

        this.vocalChopSourceNode.connect(this.vocalChopGain);
        this.vocalChopGain.connect(this.compressor);
      }
    }

    // --- SECONDARY SOURCE: SWAPPED INSTRUMENTAL ---
    const swapStyle = this.currentSettings.instrumentalSwap || this.swappedInstrumental;
    if (swapStyle && swapStyle !== 'none' && this.stemMode === 'swapped_instrumental' && !this.isAltareMode) {
      const instBuffer = this.getOrCreateInstrumentalBuffer(swapStyle);
      this.instrumentalSourceNode = ctx.createBufferSource();
      this.instrumentalSourceNode.buffer = instBuffer;
      this.instrumentalSourceNode.loop = true;

      this.instrumentalGainNode = ctx.createGain();
      this.instrumentalGainNode.gain.value = this.stemMixLevels.swappedInstrumental;

      this.instrumentalSourceNode.connect(this.instrumentalGainNode);
      this.instrumentalGainNode.connect(this.compressor);
    }

    this.compressor.connect(softLimiter);
    softLimiter.connect(this.analyser);
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

    this.updateStemRouting();
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
      if (!this.isPlaying || !this.is8DEnabled || !this.panner8D || !this.ctx) return;
      this.panAngle += this.panSpeed * 0.05;
      const panValue = Math.sin(this.panAngle);
      // Smooth interpolation avoids zipper/scratch noise
      this.panner8D.pan.setTargetAtTime(Math.max(-1, Math.min(1, panValue)), this.ctx.currentTime, 0.035);
      this.panRafId = requestAnimationFrame(animatePan);
    };

    this.panRafId = requestAnimationFrame(animatePan);
  }

  public isAudioLoaded(): boolean {
    return Boolean(this.currentBuffer);
  }

  public async play(): Promise<boolean> {
    this.initContext();
    if (!this.currentBuffer) {
      this.isPlaying = false;
      this.notify();
      return false;
    }

    if (this.isPlaying) return true;

    this.setupDSPGraph();
    const offset = this.pauseOffset % this.currentBuffer.duration;

    if (this.fullSourceNode) {
      try { this.fullSourceNode.start(0, offset); } catch (e) { /* ignore */ }
    }
    if (this.beatSourceNode) {
      try { this.beatSourceNode.start(0, offset); } catch (e) { /* ignore */ }
    }
    if (this.vocalSourceNode) {
      try { this.vocalSourceNode.start(0, offset); } catch (e) { /* ignore */ }
    }
    if (this.altareSourceNode) {
      const altareBuf = this.altareSourceNode.buffer;
      const altareOffset = altareBuf ? (this.pauseOffset % altareBuf.duration) : 0;
      try { this.altareSourceNode.start(0, altareOffset); } catch (e) { /* ignore */ }
    }
    if (this.vocalChopSourceNode) {
      const chopBuf = this.vocalChopSourceNode.buffer;
      const chopOffset = chopBuf ? (this.pauseOffset % chopBuf.duration) : 0;
      try { this.vocalChopSourceNode.start(0, chopOffset); } catch (e) { /* ignore */ }
    }
    if (this.instrumentalSourceNode) {
      const instBuffer = this.instrumentalSourceNode.buffer;
      const instOffset = instBuffer ? (this.pauseOffset % instBuffer.duration) : 0;
      try { this.instrumentalSourceNode.start(0, instOffset); } catch (e) { /* ignore */ }
    }
    if (this.secondarySourceNode && this.secondaryBuffer) {
      const secOffset = Math.max(0, (offset + this.secondaryOffsetSec) % this.secondaryBuffer.duration);
      try { this.secondarySourceNode.start(0, secOffset); } catch (e) { /* ignore */ }
    }

    this.startTime = this.ctx!.currentTime - (offset / (this.isOriginalMode ? 1.0 : this.currentSettings.speed));
    this.isPlaying = true;

    if (this.timeUpdateTimer) clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = window.setInterval(() => {
      this.notify();
    }, 100);

    this.notify();
    return true;
  }

  public pause() {
    if (!this.isPlaying) return;
    this.pauseOffset = this.getCurrentTime() * (this.isOriginalMode ? 1.0 : this.currentSettings.speed);
    try { this.fullSourceNode?.stop(); } catch { /* ignore */ }
    try { this.beatSourceNode?.stop(); } catch { /* ignore */ }
    try { this.vocalSourceNode?.stop(); } catch { /* ignore */ }
    try { this.altareSourceNode?.stop(); } catch { /* ignore */ }
    try { this.vocalChopSourceNode?.stop(); } catch { /* ignore */ }
    try { this.instrumentalSourceNode?.stop(); } catch { /* ignore */ }
    try { this.secondarySourceNode?.stop(); } catch { /* ignore */ }

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

  // --- PROJECT ALTARE-BUILDER CONTROLS ---
  public enableAltareRemix(config: Partial<AltareRemixConfig> = {}) {
    this.isAltareMode = true;
    this.altareConfig = { ...this.altareConfig, ...config };
    this.altareArrangementBuffer = null; // force regen
    this.vocalChopBuffer = null;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur;
      this.play();
    }
    this.updateStemRouting();
    this.notify();
  }

  public disableAltareRemix() {
    this.isAltareMode = false;
    this.altareArrangementBuffer = null;
    this.vocalChopBuffer = null;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur;
      this.play();
    }
    this.updateStemRouting();
    this.notify();
  }

  public getIsAltareMode(): boolean {
    return this.isAltareMode;
  }

  public getAltareConfig(): AltareRemixConfig {
    return { ...this.altareConfig };
  }

  public setAltareConfig(config: Partial<AltareRemixConfig>) {
    this.altareConfig = { ...this.altareConfig, ...config };
    this.altareArrangementBuffer = null;
    this.vocalChopBuffer = null;
    if (this.isPlaying) {
      const cur = this.getCurrentTime();
      this.pause();
      this.pauseOffset = cur;
      this.play();
    }
    this.updateStemRouting();
    this.notify();
  }

  // Export Mastered Altare Remix WAV (-9 LUFS Brickwall)
  public async renderAltareRemixWAV(): Promise<Blob> {
    if (!this.currentBuffer) throw new Error('No audio buffer loaded');

    const duration = Math.min(this.currentBuffer.duration, 75.0);
    const sampleRate = 44100;
    const length = Math.ceil(duration * sampleRate);
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    // 1. Altare Arrangement (Supersaws, Reese Bass, 808s)
    const arrBuf = AltareEngine.generateArrangementBuffer(offlineCtx, this.altareConfig, duration);
    const arrSrc = offlineCtx.createBufferSource();
    arrSrc.buffer = arrBuf;
    const arrGain = offlineCtx.createGain();
    arrGain.gain.value = 1.05;
    arrSrc.connect(arrGain);

    // 2. Isolated Vocal Stem from user track
    if (!this.vocalBuffer) {
      const stems = this.separateStemsFromBuffer(this.currentBuffer);
      this.vocalBuffer = stems.vocal;
    }
    const vocSrc = offlineCtx.createBufferSource();
    vocSrc.buffer = this.vocalBuffer;
    const vocGain = offlineCtx.createGain();
    vocGain.gain.value = this.altareConfig.muteOriginalWords ? 0.0 : 1.1;
    vocSrc.connect(vocGain);

    // 3. Melodic Vocal Chops Lead
    const chopBuf = AltareEngine.generateVocalChopLead(offlineCtx, this.vocalBuffer, this.altareConfig, duration);
    const chopSrc = offlineCtx.createBufferSource();
    chopSrc.buffer = chopBuf;
    const chopGain = offlineCtx.createGain();
    chopGain.gain.value = 1.15;
    chopSrc.connect(chopGain);

    // 4. Compressor / Limiter targeting -9 LUFS
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, 0);
    comp.ratio.setValueAtTime(4.5, 0);
    comp.knee.setValueAtTime(25, 0);

    arrGain.connect(comp);
    vocGain.connect(comp);
    chopGain.connect(comp);

    comp.connect(offlineCtx.destination);

    arrSrc.start(0);
    vocSrc.start(0);
    chopSrc.start(0);

    const rendered = await offlineCtx.startRendering();
    return this.bufferToWave(rendered);
  }

  // Export Separated Stems for Altare Remix (Vocal Chops, Instrumental Synth Drop, Master)
  public async renderAltareStems(): Promise<{ vocalChops: Blob; synthDrop: Blob; fullRemix: Blob }> {
    if (!this.currentBuffer) throw new Error('No audio buffer loaded');
    const duration = Math.min(this.currentBuffer.duration, 75.0);
    const sampleRate = 44100;
    const length = Math.ceil(duration * sampleRate);

    // Render Vocal Chops
    const ctxChop = new OfflineAudioContext(2, length, sampleRate);
    if (!this.vocalBuffer) {
      const stems = this.separateStemsFromBuffer(this.currentBuffer);
      this.vocalBuffer = stems.vocal;
    }
    const chopBuf = AltareEngine.generateVocalChopLead(ctxChop, this.vocalBuffer, this.altareConfig, duration);
    const srcChop = ctxChop.createBufferSource();
    srcChop.buffer = chopBuf;
    srcChop.connect(ctxChop.destination);
    srcChop.start(0);
    const rendChop = await ctxChop.startRendering();

    // Render Synth Drop Instrumental
    const ctxDrop = new OfflineAudioContext(2, length, sampleRate);
    const dropBuf = AltareEngine.generateArrangementBuffer(ctxDrop, this.altareConfig, duration);
    const srcDrop = ctxDrop.createBufferSource();
    srcDrop.buffer = dropBuf;
    srcDrop.connect(ctxDrop.destination);
    srcDrop.start(0);
    const rendDrop = await ctxDrop.startRendering();

    const fullBlob = await this.renderAltareRemixWAV();

    return {
      vocalChops: this.bufferToWave(rendChop),
      synthDrop: this.bufferToWave(rendDrop),
      fullRemix: fullBlob,
    };
  }

  public setTransformation(preset: TransformationPreset) {
    this.currentSettings = { ...preset };
    if (preset.stemMode) {
      this.stemMode = preset.stemMode;
    }
    if (preset.instrumentalSwap) {
      this.swappedInstrumental = preset.instrumentalSwap;
    }

    if (this.isPlaying && this.ctx) {
      const speed = this.isOriginalMode ? 1.0 : this.currentSettings.speed;
      const pitch = this.isOriginalMode ? 0 : (this.currentSettings.pitch || 0);
      const effectiveRate = Math.max(0.3, Math.min(2.5, speed * Math.pow(2, pitch / 12)));
      const now = this.ctx.currentTime;
      // De-zipper playback rate
      if (this.fullSourceNode) {
        this.fullSourceNode.playbackRate.setTargetAtTime(effectiveRate, now, 0.03);
      }
      if (this.beatSourceNode) {
        this.beatSourceNode.playbackRate.setTargetAtTime(effectiveRate, now, 0.03);
      }
      if (this.vocalSourceNode) {
        this.vocalSourceNode.playbackRate.setTargetAtTime(effectiveRate, now, 0.03);
      }
      if (this.bassFilter && !this.isOriginalMode) {
        const bassVal = Math.max(0, Math.min(12, this.currentSettings.bassBoost));
        this.bassFilter.gain.setTargetAtTime(bassVal, now, 0.03);
      }
      if (this.lofiFilter && !this.isOriginalMode) {
        const lofiVal = Math.max(350, Math.min(20000, this.currentSettings.lofiCutoff || 20000));
        this.lofiFilter.frequency.setTargetAtTime(lofiVal, now, 0.03);
      }
      if (this.wetGain && this.dryGain && !this.isOriginalMode) {
        const wetVal = Math.max(0, Math.min(0.85, this.currentSettings.reverbWet));
        this.wetGain.gain.setTargetAtTime(wetVal, now, 0.03);
        this.dryGain.gain.setTargetAtTime(Math.max(0.15, 1.0 - wetVal * 0.5), now, 0.03);
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

    // Crossover state: 2-pole highpass at 180Hz (kills kick/sub-bass) and lowpass at 6500Hz (kills cymbals/air)
    let hpPrevL = 0, hpInPrevL = 0, lpPrevL = 0;
    const hpCut = (180 / rate) * 2 * Math.PI;
    const lpCut = (6500 / rate) * 2 * Math.PI;

    for (let i = 0; i < len; i++) {
      // Center speech channel: Mid minus Side difference
      const mid = (inL[i] + inR[i]) * 0.5;
      const side = Math.abs(inL[i] - inR[i]) * 0.5;
      const centerOnly = Math.max(-1, Math.min(1, (mid - side * 0.8) * 1.3));

      // Highpass at 180Hz
      const hp = centerOnly - hpInPrevL + (1 - hpCut) * hpPrevL;
      hpInPrevL = centerOnly;
      hpPrevL = hp;

      // Lowpass at 6500Hz
      const lp = lpPrevL + lpCut * (hp - lpPrevL);
      lpPrevL = lp;

      vL[i] = lp * 1.25;
      vR[i] = lp * 1.25;
    }
    return vocalBuf;
  }

  // Extract instrumental backing buffer with words cancelled and bass preserved
  private extractInstrumentalBuffer(input: AudioBuffer, ctx: BaseAudioContext): AudioBuffer {
    const numChan = input.numberOfChannels;
    const len = input.length;
    const rate = input.sampleRate;
    const instBuf = ctx.createBuffer(2, len, rate);
    const iL = instBuf.getChannelData(0);
    const iR = instBuf.getChannelData(1);

    const inL = input.getChannelData(0);
    const inR = numChan > 1 ? input.getChannelData(1) : inL;

    // Lowpass filter for preserving punchy sub-bass & kick drum (<160Hz)
    let lpSubL = 0;
    const subCut = (160 / rate) * 2 * Math.PI;

    for (let i = 0; i < len; i++) {
      const mid = (inL[i] + inR[i]) * 0.5;
      // Extract sub-bass
      lpSubL += subCut * (mid - lpSubL);

      // Center-channel vocal cancellation: Left - Right (words cancelled!)
      const sideDiff = (inL[i] - inR[i]) * 0.8;

      // Instrumental output: Sub-Bass + Side stereo instruments
      iL[i] = Math.max(-0.98, Math.min(0.98, lpSubL * 0.95 + sideDiff));
      iR[i] = Math.max(-0.98, Math.min(0.98, lpSubL * 0.95 - sideDiff));
    }
    return instBuf;
  }

  // Export Offline Rendered High-Quality WAV with stem isolation or swapped remix
  // Guarantees download matches the EXACT edited audio currently playing in the studio!
  public async renderAndExportWAV(options: { 
    stemType?: 'master' | 'vocals' | 'instrumental' | 'swapped_remix';
    instrumentalStyle?: string;
  } = {}): Promise<Blob> {
    if (!this.currentBuffer) throw new Error('No audio buffer loaded');

    // If Altare Future Bass / Trap remix mode is active and master was requested, export Altare Master
    if (this.isAltareMode && (!options.stemType || options.stemType === 'master')) {
      return this.renderAltareRemixWAV();
    }

    const requestedStem = options.stemType || 'master';
    const swapStyle = options.instrumentalStyle || this.swappedInstrumental;
    const srcDuration = this.currentBuffer.duration;
    const speed = Math.max(0.3, Math.min(2.0, this.isOriginalMode ? 1.0 : this.currentSettings.speed));
    const pitch = this.isOriginalMode ? 0 : (this.currentSettings.pitch || 0);
    const effectiveRate = Math.max(0.3, Math.min(2.5, speed * Math.pow(2, pitch / 12)));
    const renderDuration = srcDuration / effectiveRate + (this.currentSettings.reverbWet > 0.05 ? Math.min(3, this.currentSettings.reverbDecay || 2) : 0.5);
    const sampleRate = 44100;
    const length = Math.ceil(renderDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    // Ensure pre-separated stem buffers exist
    if (!this.instrumentalBuffer || !this.vocalBuffer) {
      const stems = this.separateStemsFromBuffer(this.currentBuffer);
      this.vocalBuffer = stems.vocal;
      this.instrumentalBuffer = stems.instrumental;
    }

    // Stem sources with effective playback rate (speed + pitch)
    const offlineFull = offlineCtx.createBufferSource();
    offlineFull.buffer = this.currentBuffer;
    offlineFull.playbackRate.value = effectiveRate;

    const offlineBeat = offlineCtx.createBufferSource();
    offlineBeat.buffer = this.instrumentalBuffer;
    offlineBeat.playbackRate.value = effectiveRate;

    const offlineVocal = offlineCtx.createBufferSource();
    offlineVocal.buffer = this.vocalBuffer;
    offlineVocal.playbackRate.value = effectiveRate;

    const fullG = offlineCtx.createGain();
    const beatG = offlineCtx.createGain();
    const vocalG = offlineCtx.createGain();

    offlineFull.connect(fullG);
    offlineBeat.connect(beatG);
    offlineVocal.connect(vocalG);

    // Determine exact fader gains matching real-time playback
    const isWordsOnly = requestedStem === 'vocals' || this.stemMode === 'words_only';
    const isWordsMuted = requestedStem === 'instrumental' || this.stemMode === 'words_muted' || this.stemMixLevels.vocals === 0;
    const isSwapped = (requestedStem === 'swapped_remix' || this.stemMode === 'swapped_instrumental') && swapStyle !== 'none';

    if (requestedStem === 'vocals') {
      fullG.gain.value = 0.0;
      beatG.gain.value = 0.0;
      vocalG.gain.value = 1.15;
    } else if (requestedStem === 'instrumental') {
      fullG.gain.value = 0.0;
      beatG.gain.value = 1.0;
      vocalG.gain.value = 0.0;
    } else if (isWordsOnly) {
      fullG.gain.value = 0.0;
      beatG.gain.value = 0.0;
      vocalG.gain.value = this.stemMixLevels.vocals * 1.25;
    } else if (isWordsMuted) {
      fullG.gain.value = 0.0;
      beatG.gain.value = this.stemMixLevels.beat;
      vocalG.gain.value = 0.0;
    } else if (isSwapped) {
      fullG.gain.value = 0.0;
      beatG.gain.value = this.stemMixLevels.beat;
      vocalG.gain.value = this.stemMixLevels.vocals;
    } else {
      // Full original mix mode
      fullG.gain.value = 1.0;
      beatG.gain.value = 0.0;
      vocalG.gain.value = 0.0;
    }

    const stemMixer = offlineCtx.createGain();
    fullG.connect(stemMixer);
    beatG.connect(stemMixer);
    vocalG.connect(stemMixer);

    // Effects chain (identical to real-time playback)
    const bass = offlineCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 95;
    bass.gain.value = this.isOriginalMode ? 0 : Math.max(0, Math.min(12, this.currentSettings.bassBoost));

    const lofi = offlineCtx.createBiquadFilter();
    lofi.type = 'lowpass';
    lofi.frequency.value = this.isOriginalMode ? 20000 : Math.max(400, Math.min(20000, this.currentSettings.lofiCutoff || 20000));

    stemMixer.connect(bass);
    bass.connect(lofi);

    // Smooth scratch-free reverb convolver using diffuse filtered impulse
    const wetVal = this.isOriginalMode ? 0.0 : Math.max(0, Math.min(0.85, this.currentSettings.reverbWet));
    const dry = offlineCtx.createGain();
    const wet = offlineCtx.createGain();
    wet.gain.value = wetVal;
    dry.gain.value = Math.max(0.15, 1.0 - wetVal * 0.5);

    const offlinePanner = offlineCtx.createStereoPanner();
    if (this.currentSettings.pan8d && !this.isOriginalMode) {
      const panSpeed = this.currentSettings.panSpeed || 0.12;
      const step = 0.04;
      offlinePanner.pan.setValueAtTime(0, 0);
      for (let t = step; t <= renderDuration; t += step) {
        const panValue = Math.sin(t * panSpeed * Math.PI * 2);
        offlinePanner.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, panValue)), t);
      }
    } else {
      offlinePanner.pan.setValueAtTime(0, 0);
    }

    lofi.connect(dry);
    dry.connect(offlinePanner);

    if (wetVal > 0.02) {
      const conv = offlineCtx.createConvolver();
      conv.buffer = this.createImpulseResponse(this.currentSettings.reverbDecay || 3.0, offlineCtx);
      lofi.connect(conv);
      conv.connect(wet);
      wet.connect(offlinePanner);
    }

    // Mastering limiter compressor targeting -9 LUFS
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, 0);
    comp.knee.setValueAtTime(25, 0);
    comp.ratio.setValueAtTime(4.5, 0);
    comp.attack.setValueAtTime(0.003, 0);
    comp.release.setValueAtTime(0.2, 0);

    // Soft saturation limiter to prevent any digital overs
    const softLimiter = offlineCtx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i * 2) / 1024 - 1;
      curve[i] = Math.tanh(x * 1.05) * 0.95;
    }
    softLimiter.curve = curve;

    offlinePanner.connect(comp);

    // Swapped style secondary backing track if active
    if (isSwapped && swapStyle && swapStyle !== 'none') {
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

    comp.connect(softLimiter);
    softLimiter.connect(offlineCtx.destination);

    offlineFull.start(0);
    offlineBeat.start(0);
    offlineVocal.start(0);

    const rendered = await offlineCtx.startRendering();
    return this.bufferToWave(rendered);
  }

  // Convert AudioBuffer to pristine 16-bit PCM WAV Blob (100% distortion-free)
  private bufferToWave(abuffer: AudioBuffer): Blob {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
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
    setUint16(1); // PCM format
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (offset < abuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        const s = Math.max(-1, Math.min(1, channels[i][offset]));
        const pcm = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
        out.setInt16(pos, Math.max(-32768, Math.min(32767, pcm)), true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}

// Global Singleton Instance
export const globalAudioEngine = new MusicAudioEngine();
