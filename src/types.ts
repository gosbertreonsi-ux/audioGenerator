export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  bpm: number;
  key: string;
  energy: 'Low' | 'Medium' | 'High' | 'Very High';
  vocals: 'Detected' | 'Instrumental Only' | 'Vocal Chop';
  lufs: number;
  genre: string;
  coverUrl: string;
  audioUrl?: string;
  sourceType: 'preset_stem' | 'user_upload';
}

export interface TransformationPreset {
  id: string;
  name: string;
  category: 'Slowed' | 'Sped Up' | 'Spatial' | 'Reverb' | 'Bass' | 'Atmosphere' | 'Retro' | 'Experimental' | 'Afrobeat' | 'Amapiano' | 'African Rhythms' | 'Remix & Swap';
  badge: string;
  description: string;
  speed: number; // 0.5 - 1.6
  pitch: number; // -12 to +12 semitones
  reverbWet: number; // 0 - 1
  reverbDecay: number; // 0.5 - 10 sec
  bassBoost: number; // 0 - 15 dB
  stereoWidth: number; // 0.5 - 2.0
  pan8d: boolean;
  panSpeed: number; // 0.04 - 0.4 Hz
  lofiCutoff: number; // 1000 - 20000 Hz
  color: string;
  stemMode?: StemMode;
  instrumentalSwap?: string;
}

export interface ContentPack {
  youtubeTitle: string;
  youtubeAlternativeTitles: string[];
  description: string;
  tags: string[];
  tiktokCaption: string;
  reelsCaption: string;
  bestMoments: {
    title: string;
    start: string;
    end: string;
    vibe: string;
  }[];
  thumbnailVisualPrompts: string[];
}

export interface JobItem {
  id: string;
  title: string;
  type: 'Audio Transform' | 'Visualizer Video' | 'Short Clip' | 'Content Pack' | 'Mastering';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PAUSED';
  progress: number;
  size: string;
  eta: string;
  timestamp: string;
}

export interface RightsAssessment {
  status: 'GREEN' | 'YELLOW' | 'RED';
  badge: string;
  analysis: string;
  checklist: { label: string; passed: boolean }[];
  recommendation: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'In Studio' | 'Rendering' | 'Online' | 'Offline';
  currentTrack?: string;
}

export interface VideoVisualizerSettings {
  aspectRatio: '16:9' | '9:16' | '1:1';
  visualMode: 'circular' | 'bars' | 'mirror_bars' | 'oscilloscope' | 'particles' | 'orbit8d' | 'pulse_ring' | 'cassette_vu';
  wavePosition: 'bottom' | 'lower_third' | 'center' | 'horizon' | 'ambient';
  colorTheme: string;
  customColor: string;
  secondaryColor?: string;
  sensitivity: number;
  barCount: number;
  barWidth: number;
  glowIntensity: number;
  waveOpacity: number;
  backgroundImage: string | null;
  backgroundPreset: string;
  backgroundDim: number;
  backgroundBlur: number;
  bassPulseBg: boolean;
  showCoverCenter: boolean;
  titleText: string;
  artistText: string;
  badgeText: string;
  showWatermark: boolean;
  watermarkText: string;
  showLyrics: boolean;
  lyricsText: string;
  textPosition: 'bottom_left' | 'center' | 'top_left' | 'bottom_center';
}

export interface VocalModel {
  id: string;
  name: string;
  companyOrLabel: string;
  category: 
    | 'Afrobeat & West African' 
    | 'Amapiano & Southern African' 
    | 'East & Central African' 
    | 'North African & Maghreb' 
    | 'Words Only & Acapella Isolators' 
    | 'Pop & Billboard' 
    | 'Hip-Hop & Trap' 
    | 'R&B & Neo-Soul' 
    | 'Drill & UK' 
    | 'Hyperpop & Glitch' 
    | 'Rock & Alternative' 
    | 'Electronic & Dance' 
    | 'Cinematic & Choral' 
    | 'Retro & Vintage';
  vocalistArchetype: string;
  description: string;
  hardwarePedigree: string;
  settings: {
    pitchShift: number;
    autotuneSpeed: number;
    formantShift: number;
    saturationDrive: number;
    reverbWet: number;
    reverbDecay: number;
    airBandBoost: number;
    deEsserAmount: number;
    doublerWidth: number;
    chorusRate: number;
    compressionRatio: string;
  };
  tags: string[];
  color: string;
  popularityScore: number;
}

export type StemMode = 'full' | 'words_only' | 'beat_only' | 'words_muted' | 'swapped_instrumental';

export interface InstrumentalSwapOption {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  origin: string;
  description: string;
  instruments: string[];
  color: string;
  badge: string;
}

export interface StemMixLevels {
  vocals: number; // 0.0 - 1.5
  beat: number; // 0.0 - 1.5
  swappedInstrumental: number; // 0.0 - 1.5
  bass: number; // 0.0 - 1.5
}

// ==========================================
// MIZIZI STUDIO 2.0 PRD TYPES
// ==========================================

export type MiziziWorkspaceMode = 'utilities' | 'creative';

export type UtilityCategory = 'video' | 'audio' | 'pdf' | 'image' | 'converter' | 'queue';

export interface UtilityToolDefinition {
  id: string;
  name: string;
  nameSwahili?: string;
  category: UtilityCategory;
  description: string;
  icon: string;
  badge?: string;
  supportedInputTypes: string[];
  outputFormat: string;
}

export interface LyricLine {
  id: string;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  isRecorded?: boolean;
}

export interface LyricVideoConfig {
  fontFamily: 'Space Grotesk' | 'Plus Jakarta Sans' | 'Impact' | 'Serif' | 'Monospace';
  fontSize: number; // 18 - 64
  textColor: string;
  highlightColor: string;
  textAlign: 'center' | 'left' | 'right';
  positionY: number; // 20 - 85 percentage
  animationStyle: 'fade' | 'karaoke_glow' | 'bounce' | 'slide_up';
  aspectRatio: '9:16' | '16:9' | '1:1';
  backgroundType: 'video' | 'image' | 'preset_motion';
  backgroundUrl: string;
  backgroundDim: number; // 0 - 0.9
  backgroundBlur: number; // 0 - 20
  uppercase: boolean;
}

export interface MiziziPersistentJob {
  id: string;
  name: string;
  category: UtilityCategory;
  toolName: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  inputFileName: string;
  outputFileName?: string;
  outputBlobUrl?: string;
  outputBlob?: Blob;
  outputMimeType?: string;
  fileSizeStr?: string;
  durationSec?: number;
  createdAt: number;
  completedAt?: number;
}


