export type EditorMode = 'quick' | 'edit' | 'pro';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type ClipType = 'video' | 'audio' | 'image' | 'text' | 'effect';

export interface TransformProps {
  scale: number; // 0.2 - 3.0
  x: number; // pixels offset
  y: number; // pixels offset
  rotation: number; // degrees
  flipH: boolean;
  flipV: boolean;
}

export interface ColorGradingProps {
  exposure: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -100 to 100 (warm/cool)
  tint: number; // -100 to 100
  lut: 'none' | 'teal_orange' | 'cyberpunk' | 'warm_sunset' | 'noir' | 'vintage_vhs';
}

export interface TextOverlayProps {
  text: string;
  fontSize: number;
  color: string;
  glowColor: string;
  hasGlow: boolean;
  fontFamily: string;
  align: 'center' | 'left' | 'right';
  backgroundBox: boolean;
  animation: 'none' | 'bounce' | 'fade' | 'pop' | 'typewriter';
}

export interface AudioClipProps {
  volume: number; // 0 - 2.0
  muteWords: boolean; // Karaoke / Words Muted
  muteBeat: boolean; // Acapella Words Only
  styleSwap: string; // 'none' | 'afrobeat_lagos' | 'southern_trap' | 'amapiano_logdrum' | etc.
  fadeIn: number;
  fadeOut: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  title: string;
  type: ClipType;
  startTime: number; // in seconds
  duration: number; // in seconds
  sourceIn: number;
  sourceOut: number;
  speed: number;
  opacity: number;
  blendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'add';
  transform: TransformProps;
  colorGrading: ColorGradingProps;
  textProps?: TextOverlayProps;
  audioProps?: AudioClipProps;
  effectName?: string;
  color: string;
  mediaUrl?: string;
  thumbnail?: string;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  order: number;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  visible: boolean;
  volume: number;
}

export interface BeatMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'beat' | 'drop' | 'vocal_start' | 'scene_change';
}

export interface AIEditPlanStep {
  id: string;
  title: string;
  description: string;
  actionType: 'mute_words' | 'mute_beat' | 'swap_style' | 'cut_to_beat' | 'add_captions' | 'color_grade' | 'add_effect' | 'trim_silence';
  params?: Record<string, unknown>;
  status: 'pending' | 'applied';
}

export interface AIEditPlan {
  id: string;
  prompt: string;
  headline: string;
  summary: string;
  steps: AIEditPlanStep[];
  timestamp: string;
}

export interface VizmotionProject {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  duration: number; // in seconds
  fps: number;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  markers: BeatMarker[];
  activeAIPlan?: AIEditPlan | null;
}
