import { TimelineClip, TimelineTrack, BeatMarker, VizmotionProject } from './vizmotionTypes';

export interface StockMediaItem {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect' | 'sfx';
  category: string;
  duration: number;
  thumbnail: string;
  color: string;
  description: string;
  meta?: {
    bpm?: number;
    genre?: string;
    text?: string;
    effect?: string;
  };
}

export const STOCK_MEDIA_LIBRARY: StockMediaItem[] = [
  // Video footage
  {
    id: 'vid-neon-drive',
    title: 'Neon Cyber City Performance',
    type: 'video',
    category: 'Visuals',
    duration: 12,
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60',
    color: '#ea3838',
    description: '4K cinematic neon city night footage with intense chromatic lighting'
  },
  {
    id: 'vid-afro-dance',
    title: 'Lagos Street Afro-Dance Crew',
    type: 'video',
    category: 'Visuals',
    duration: 10,
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60',
    color: '#f59e0b',
    description: 'High energy syncopated choreography matching 112 BPM Afrobeat rhythms'
  },
  {
    id: 'vid-concert-crowd',
    title: 'Stadium Festival Lights & Flares',
    type: 'video',
    category: 'Visuals',
    duration: 14,
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=60',
    color: '#8b5cf6',
    description: 'Festival stage laser pyro show with cheering crowd atmosphere'
  },
  {
    id: 'vid-trap-vintage',
    title: 'Southern Studio Smoke & 808s',
    type: 'video',
    category: 'Visuals',
    duration: 8,
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=60',
    color: '#ec4899',
    description: 'Moody analog mixing console, neon VU meters and smoke swirls'
  },

  // Titles & Graphics
  {
    id: 'txt-kinetic-neon',
    title: 'Kinetic TikTok Lyric Caption',
    type: 'text',
    category: 'Titles',
    duration: 6,
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=60',
    color: '#ea3838',
    description: 'Punchy glowing lyric caption with beat-bounce animation',
    meta: { text: 'VIZMOTION • FEEL THE BEAT' }
  },
  {
    id: 'txt-cinematic-intro',
    title: 'Cinematic Minimalist Title',
    type: 'text',
    category: 'Titles',
    duration: 8,
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&auto=format&fit=crop&q=60',
    color: '#fcd34d',
    description: 'Wide tracked uppercase letterspacing with subtle blur fade-in',
    meta: { text: 'A F R O B E A T  V I S I O N' }
  },

  // Effects & Filters
  {
    id: 'fx-teal-orange',
    title: 'Teal & Orange Hollywood LUT',
    type: 'effect',
    category: 'Effects',
    duration: 10,
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&auto=format&fit=crop&q=60',
    color: '#06b6d4',
    description: 'Classic cinema color separation with warm skin tones and teal shadows',
    meta: { effect: 'teal_orange' }
  },
  {
    id: 'fx-zoom-shake',
    title: '808 Bass Impact Zoom Shake',
    type: 'effect',
    category: 'Effects',
    duration: 2,
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=60',
    color: '#f43f5e',
    description: 'Audio-reactive camera jolt matching bass drum hits',
    meta: { effect: 'zoom_shake' }
  },
  {
    id: 'fx-vhs-scanlines',
    title: 'Retro VHS & CRT Glitch',
    type: 'effect',
    category: 'Effects',
    duration: 8,
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=60',
    color: '#a855f7',
    description: 'Phosphor scanline texture with subtle horizontal tape noise',
    meta: { effect: 'vintage_vhs' }
  },

  // Sound FX
  {
    id: 'sfx-riser',
    title: 'Cinematic Beat Riser & Whoosh',
    type: 'sfx',
    category: 'Sound FX',
    duration: 4,
    thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&auto=format&fit=crop&q=60',
    color: '#3b82f6',
    description: 'Tension-building filtered noise sweep for drop transitions',
    meta: { bpm: 112 }
  },
  {
    id: 'sfx-808-drop',
    title: 'Sub 808 Impact Boom',
    type: 'sfx',
    category: 'Sound FX',
    duration: 3,
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=60',
    color: '#ef4444',
    description: 'Deep 32 Hz sub-bass boom designed for clip cut transitions',
    meta: { bpm: 140 }
  }
];

export const INITIAL_TRACKS: TimelineTrack[] = [
  { id: 'track-v3', name: 'V3 Titles / Graphics', type: 'text', order: 0, muted: false, solo: false, locked: false, visible: true, volume: 1.0 },
  { id: 'track-v2', name: 'V2 Overlays / Effects', type: 'effect', order: 1, muted: false, solo: false, locked: false, visible: true, volume: 1.0 },
  { id: 'track-v1', name: 'V1 Video Footage', type: 'video', order: 2, muted: false, solo: false, locked: false, visible: true, volume: 1.0 },
  { id: 'track-a1', name: 'A1 Audio / Music Stems', type: 'audio', order: 3, muted: false, solo: false, locked: false, visible: true, volume: 1.0 },
  { id: 'track-a2', name: 'A2 Voice / Sound FX', type: 'audio', order: 4, muted: false, solo: false, locked: false, visible: true, volume: 1.0 },
];

export const INITIAL_CLIPS: TimelineClip[] = [
  // V3 Titles
  {
    id: 'clip-t1',
    trackId: 'track-v3',
    title: 'VIZMOTION Kinetic Title',
    type: 'text',
    startTime: 1.5,
    duration: 6.0,
    sourceIn: 0,
    sourceOut: 6.0,
    speed: 1.0,
    opacity: 1.0,
    blendMode: 'normal',
    transform: { scale: 1.0, x: 0, y: 140, rotation: 0, flipH: false, flipV: false },
    colorGrading: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, lut: 'none' },
    textProps: {
      text: 'VIZMOTION • AFRO-KINETIC VIBE',
      fontSize: 32,
      color: '#ffffff',
      glowColor: '#ea3838',
      hasGlow: true,
      fontFamily: 'sans-serif',
      align: 'center',
      backgroundBox: true,
      animation: 'bounce'
    },
    color: '#ec4899',
  },
  {
    id: 'clip-t2',
    trackId: 'track-v3',
    title: 'Drop Lyric Hook',
    type: 'text',
    startTime: 12.0,
    duration: 8.0,
    sourceIn: 0,
    sourceOut: 8.0,
    speed: 1.0,
    opacity: 1.0,
    blendMode: 'normal',
    transform: { scale: 1.1, x: 0, y: -80, rotation: 0, flipH: false, flipV: false },
    colorGrading: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, lut: 'none' },
    textProps: {
      text: 'WORDS ISOLATED • ORIGINAL WORDS MUTED',
      fontSize: 26,
      color: '#fbbf24',
      glowColor: '#f59e0b',
      hasGlow: true,
      fontFamily: 'monospace',
      align: 'center',
      backgroundBox: true,
      animation: 'pop'
    },
    color: '#eab308',
  },

  // V2 Overlays
  {
    id: 'clip-fx1',
    trackId: 'track-v2',
    title: 'Teal & Orange Grade',
    type: 'effect',
    startTime: 0,
    duration: 18.0,
    sourceIn: 0,
    sourceOut: 18.0,
    speed: 1.0,
    opacity: 0.85,
    blendMode: 'overlay',
    transform: { scale: 1.0, x: 0, y: 0, rotation: 0, flipH: false, flipV: false },
    colorGrading: { exposure: 10, contrast: 20, saturation: 25, temperature: 15, tint: -5, lut: 'teal_orange' },
    effectName: 'teal_orange',
    color: '#06b6d4',
  },

  // V1 Video Clips
  {
    id: 'clip-v1',
    trackId: 'track-v1',
    title: 'Clip A: Neon Cyber City',
    type: 'video',
    startTime: 0,
    duration: 8.5,
    sourceIn: 0,
    sourceOut: 8.5,
    speed: 1.0,
    opacity: 1.0,
    blendMode: 'normal',
    transform: { scale: 1.0, x: 0, y: 0, rotation: 0, flipH: false, flipV: false },
    colorGrading: { exposure: 5, contrast: 15, saturation: 20, temperature: 0, tint: 0, lut: 'cyberpunk' },
    color: '#ea3838',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'clip-v2',
    trackId: 'track-v1',
    title: 'Clip B: Lagos Afro-Dance',
    type: 'video',
    startTime: 8.5,
    duration: 8.5,
    sourceIn: 0,
    sourceOut: 8.5,
    speed: 1.0,
    opacity: 1.0,
    blendMode: 'normal',
    transform: { scale: 1.05, x: 0, y: 0, rotation: 0, flipH: false, flipV: false },
    colorGrading: { exposure: 10, contrast: 10, saturation: 15, temperature: 10, tint: 0, lut: 'warm_sunset' },
    color: '#f59e0b',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'clip-v3',
    trackId: 'track-v1',
    title: 'Clip C: Festival Crowd',
    type: 'video',
    startTime: 17.0,
    duration: 13.0,
    sourceIn: 0,
    sourceOut: 13.0,
    speed: 1.0,
    opacity: 1.0,
    blendMode: 'normal',
    transform: { scale: 1.0, x: 0, y: 0, rotation: 0, flipH: false, flipV: false },
    colorGrading: { exposure: 0, contrast: 25, saturation: 30, temperature: -5, tint: 0, lut: 'teal_orange' },
    color: '#8b5cf6',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=60'
  }
];

export const INITIAL_BEAT_MARKERS: BeatMarker[] = [];

export const INITIAL_PROJECT: VizmotionProject = {
  id: 'proj-vizmotion-alpha',
  name: 'VIZMOTION Afrobeat Anthem (Edit v1.0)',
  aspectRatio: '16:9',
  duration: 30.0,
  fps: 30,
  tracks: INITIAL_TRACKS,
  clips: INITIAL_CLIPS,
  markers: INITIAL_BEAT_MARKERS,
  activeAIPlan: null,
};
