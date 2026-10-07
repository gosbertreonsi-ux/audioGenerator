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
  category: 'Slowed' | 'Sped Up' | 'Spatial' | 'Reverb' | 'Bass' | 'Atmosphere' | 'Retro' | 'Experimental';
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

export interface VocalModel {
  id: string;
  name: string;
  companyOrLabel: string;
  category: 'Pop & Billboard' | 'Hip-Hop & Trap' | 'R&B & Neo-Soul' | 'Drill & UK' | 'Hyperpop & Glitch' | 'Rock & Alternative' | 'Electronic & Dance' | 'Cinematic & Choral' | 'Retro & Vintage';
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
