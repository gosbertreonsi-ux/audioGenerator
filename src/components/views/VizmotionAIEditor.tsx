import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Sparkles, 
  Upload, 
  Layers, 
  Sliders, 
  Scissors, 
  Copy, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Radio, 
  Film, 
  Music, 
  Type, 
  Zap, 
  Flame, 
  ArrowRightLeft, 
  Maximize2, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  SlidersHorizontal, 
  Compass, 
  Smartphone, 
  Monitor, 
  Square, 
  HelpCircle,
  FileVideo,
  FileAudio,
  Sparkle,
  Mic,
  Disc3,
  Undo2,
  Redo2,
  Save,
  FolderOpen
} from 'lucide-react';
import { 
  EditorMode, 
  AspectRatio, 
  TimelineClip, 
  TimelineTrack, 
  BeatMarker, 
  VizmotionProject, 
  AIEditPlan 
} from '../../lib/vizmotionTypes';
import { 
  STOCK_MEDIA_LIBRARY, 
  INITIAL_PROJECT, 
  StockMediaItem 
} from '../../lib/vizmotionMediaData';
import { globalAudioEngine } from '../../lib/audioEngine';
import { AudioTrack, TransformationPreset } from '../../types';

interface VizmotionAIEditorProps {
  currentTrack: AudioTrack;
  activePreset: TransformationPreset;
  onOpenInstrumentalSwapper?: () => void;
  onOpenBeatMaker?: () => void;
  onOpenVocalModels?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const VizmotionAIEditor: React.FC<VizmotionAIEditorProps> = ({
  currentTrack,
  activePreset,
  onOpenInstrumentalSwapper,
  onOpenBeatMaker,
  onOpenVocalModels,
  onNavigateTab,
}) => {
  // Project State
  const [project, setProject] = useState<VizmotionProject>(() => {
    const saved = localStorage.getItem('vizmotion_saved_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_PROJECT;
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<VizmotionProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Editor Workspace Modes: Quick / Edit / Pro (as specified in PRD)
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');

  // Media Library state
  const [mediaCategory, setMediaCategory] = useState<'all' | 'video' | 'audio' | 'text' | 'effect' | 'sfx'>('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [customMedia, setCustomMedia] = useState<StockMediaItem[]>([]);

  // Selection & Inspector
  const [selectedClipId, setSelectedClipId] = useState<string | null>(project.clips[0]?.id || null);
  const [inspectorTab, setInspectorTab] = useState<'transform' | 'color' | 'audio' | 'effects'>('transform');

  // Playback & Timeline
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [duration, setDuration] = useState(project.duration || 30.0);
  const [zoomLevel, setZoomLevel] = useState(24); // pixels per second
  const [isSnapping, setIsSnapping] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  // AI Command Bar State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [activePlan, setActivePlan] = useState<AIEditPlan | null>(null);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4'>('webm');
  const [exportQuality, setExportQuality] = useState<'1080p' | '4k' | '720p'>('1080p');
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedClip = project.clips.find(c => c.id === selectedClipId);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Save state to undo stack before mutating
  const pushHistory = useCallback((newProject: VizmotionProject) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newProject];
    });
    setHistoryIndex(prev => prev + 1);
    setProject(newProject);
    localStorage.setItem('vizmotion_saved_project', JSON.stringify(newProject));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevProject = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setProject(prevProject);
      showToast('Undone previous action', 'info');
    }
  }, [historyIndex, history, showToast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextProject = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setProject(nextProject);
      showToast('Redone action', 'info');
    }
  }, [historyIndex, history, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          handleDeleteClip(selectedClipId);
        }
      } else if (e.key.toLowerCase() === 's') {
        handleSplitAtPlayhead();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, handleUndo, handleRedo]);

  // Audio Engine Synchronization
  useEffect(() => {
    const unsub = globalAudioEngine.subscribe(({ isPlaying: audioPlaying, currentTime: audioCur }) => {
      setIsPlaying(audioPlaying);
      if (audioPlaying) {
        setCurrentTime(audioCur % duration);
      }
    });
    return () => unsub();
  }, [duration]);

  const togglePlay = () => {
    if (isPlaying) {
      globalAudioEngine.pause();
      setIsPlaying(false);
    } else {
      globalAudioEngine.seek(currentTime);
      globalAudioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(time, duration));
    setCurrentTime(clamped);
    globalAudioEngine.seek(clamped);
  };

  // -------------------------------------------------------------
  // Preview Canvas Rendering Engine (HTML5 Canvas 60 FPS)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isSubscribed = true;

    const renderFrame = () => {
      if (!isSubscribed) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = '#0a0304';
      ctx.fillRect(0, 0, width, height);

      // 2. Find active clips at currentTime
      const activeClips = project.clips.filter(
        c => currentTime >= c.startTime && currentTime <= (c.startTime + c.duration)
      );

      // Get audio analyser values for audio-reactive motion
      const analyser = globalAudioEngine.getAnalyser();
      let bassBoost = 1.0;
      let freqSum = 0;
      if (analyser) {
        const dataArr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArr);
        // Low frequencies (0-10)
        let lowSum = 0;
        for (let i = 0; i < 10; i++) lowSum += dataArr[i];
        bassBoost = 1.0 + (lowSum / (10 * 255)) * 0.18;
        for (let i = 0; i < 40; i++) freqSum += dataArr[i];
      }

      // 3. Render V1 Video / Image Clips
      const videoClips = activeClips.filter(c => c.type === 'video' || c.type === 'image');
      if (videoClips.length > 0) {
        const topVideo = videoClips[videoClips.length - 1];
        ctx.save();
        ctx.globalAlpha = topVideo.opacity;

        // Apply Transforms (scale, translation, rotation)
        ctx.translate(width / 2 + topVideo.transform.x, height / 2 + topVideo.transform.y);
        ctx.scale(topVideo.transform.scale * bassBoost, topVideo.transform.scale * bassBoost);
        if (topVideo.transform.rotation !== 0) {
          ctx.rotate((topVideo.transform.rotation * Math.PI) / 180);
        }

        // Color Grading / LUT adjustments
        const { exposure, contrast, saturation, temperature, lut } = topVideo.colorGrading;
        let filterStr = `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
        if (temperature > 0) filterStr += ` sepia(${temperature * 0.4}%)`;
        if (lut === 'teal_orange') filterStr += ' hue-rotate(15deg) contrast(115%)';
        if (lut === 'cyberpunk') filterStr += ' hue-rotate(-25deg) saturate(140%)';
        if (lut === 'noir') filterStr += ' grayscale(100%) contrast(140%)';
        ctx.filter = filterStr;

        // Draw styled gradient simulated video canvas
        const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
        grad.addColorStop(0, topVideo.color);
        grad.addColorStop(0.5, '#1e080b');
        grad.addColorStop(1, '#0a0304');
        ctx.fillStyle = grad;
        ctx.fillRect(-width / 2, -height / 2, width, height);

        // Animated visual elements inside the video clip
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 8; i++) {
          const barHeight = Math.sin(currentTime * 3 + i) * 80 + 100;
          ctx.fillRect(-width / 2 + i * (width / 8), height / 2 - barHeight, width / 10, barHeight);
        }

        // Center visual icon / title indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[ ${topVideo.title.toUpperCase()} ]`, 0, 0);

        ctx.restore();
      } else {
        // Fallback ambient stage when no video is on track
        ctx.fillStyle = '#140608';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO VIDEO CLIP AT CURRENT TIMECODE', width / 2, height / 2);
      }

      // 4. Render V2 Overlays & Effects (CRT, Teal/Orange, Scanlines, Zoom shake)
      const effectClips = activeClips.filter(c => c.type === 'effect');
      effectClips.forEach(fx => {
        ctx.save();
        if (fx.effectName === 'vintage_vhs') {
          // Scanlines
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          for (let y = 0; y < height; y += 4) {
            ctx.fillRect(0, y, width, 1.5);
          }
        } else if (fx.effectName === 'teal_orange') {
          const overlayGrad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width / 1.5);
          overlayGrad.addColorStop(0, 'rgba(245, 158, 11, 0.12)'); // warm center
          overlayGrad.addColorStop(1, 'rgba(6, 182, 212, 0.18)'); // teal edges
          ctx.fillStyle = overlayGrad;
          ctx.fillRect(0, 0, width, height);
        } else if (fx.effectName === 'zoom_shake') {
          if (bassBoost > 1.05) {
            ctx.fillStyle = 'rgba(234, 56, 56, 0.15)';
            ctx.fillRect(0, 0, width, height);
          }
        }
        ctx.restore();
      });

      // 5. Render V3 Titles & Kinetic Captions
      const textClips = activeClips.filter(c => c.type === 'text');
      textClips.forEach(tc => {
        if (!tc.textProps) return;
        ctx.save();
        const { text, fontSize, color, glowColor, hasGlow, backgroundBox, animation } = tc.textProps;

        // Position
        let posY = height / 2 + tc.transform.y;
        let posX = width / 2 + tc.transform.x;

        // Kinetic beat animation
        let animScale = 1.0;
        if (animation === 'bounce') {
          animScale = bassBoost;
        } else if (animation === 'pop') {
          animScale = 1.0 + Math.sin(currentTime * 12) * 0.08;
        }

        ctx.translate(posX, posY);
        ctx.scale(tc.transform.scale * animScale, tc.transform.scale * animScale);

        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw background box if enabled
        if (backgroundBox) {
          const metrics = ctx.measureText(text);
          const padX = 22;
          const padY = 12;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.roundRect(-metrics.width / 2 - padX, -fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2, 8);
          ctx.fill();
        }

        // Glow effect
        if (hasGlow) {
          ctx.shadowColor = glowColor || '#ea3838';
          ctx.shadowBlur = 18;
        }

        ctx.fillStyle = color;
        ctx.fillText(text, 0, 0);

        ctx.restore();
      });

      // 6. Draw subtle timecode watermark & aspect ratio guide
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`VIZMOTION AI • ${aspectRatio} • ${Math.floor(currentTime * 30)}f`, 16, 24);
      ctx.restore();

      // Next animation loop
      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTime, project.clips, aspectRatio]);

  // -------------------------------------------------------------
  // AI Command Bar Logic (Prompt Interpretation & Plan Execution)
  // -------------------------------------------------------------
  const handleExecuteAICommand = (promptText: string) => {
    if (!promptText.trim()) return;
    setIsGeneratingPlan(true);

    const query = promptText.toLowerCase();

    // Context-aware AI plan generator
    setTimeout(() => {
      let plan: AIEditPlan;

      if (query.includes('mute') && query.includes('word')) {
        plan = {
          id: `plan-${Date.now()}`,
          prompt: promptText,
          headline: 'Mute Original Words (Karaoke Instrumental & Afrobeat Groove)',
          summary: 'Cancels center-channel vocal singing words via neural notch separation, engages the 112 BPM Lagos Afrobeat backing rhythm, and synchronizes kinetic captions.',
          timestamp: 'Just now',
          steps: [
            { id: 's1', title: 'Mute Original Words', description: 'Silenced center vocal channel to 0.0 dB (Karaoke mode)', actionType: 'mute_words', status: 'pending' },
            { id: 's2', title: 'Swap Style to Lagos Afrobeat', description: 'Replaced backing beat with 112 BPM syncopated log-drums and brass', actionType: 'swap_style', status: 'pending', params: { style: 'afrobeat_lagos' } },
            { id: 's3', title: 'Generate Kinetic Lyric Title', description: 'Placed bouncy neon lyric caption at chorus timestamp', actionType: 'add_captions', status: 'pending' },
            { id: 's4', title: 'Apply Teal & Orange Grade', description: 'Enhanced saturation and filmic contrast for modern music video look', actionType: 'color_grade', status: 'pending' },
          ]
        };
      } else if (query.includes('beat') && (query.includes('mute') || query.includes('acapella') || query.includes('word only'))) {
        plan = {
          id: `plan-${Date.now()}`,
          prompt: promptText,
          headline: 'Mute Original Beat (Pure Vocal Words Acapella)',
          summary: 'Strips all drums, percussion, and synthesizers, leaving crystal-clear human vocal lyrics isolated and ready for remixing.',
          timestamp: 'Just now',
          steps: [
            { id: 's1', title: 'Mute Original Drums & Beat', description: 'Reduced rhythm tracks to 0.0 dB while boosting acapella lyrics by +2.5 dB', actionType: 'mute_beat', status: 'pending' },
            { id: 's2', title: 'Insert Spatial Reverb Atmosphere', description: 'Added 4.2s ambient decay for cinematic acapella presence', actionType: 'add_effect', status: 'pending' },
            { id: 's3', title: 'Sync Subtitle Timing', description: 'Aligned text overlay with vocal start marker', actionType: 'add_captions', status: 'pending' },
            { id: 's4', title: 'Set Mood to Cyberpunk Neon', description: 'Applied high-contrast magenta/cyan LUT for vocal isolation focus', actionType: 'color_grade', status: 'pending' },
          ]
        };
      } else if (query.includes('southern') || query.includes('trap') || query.includes('808')) {
        plan = {
          id: `plan-${Date.now()}`,
          prompt: promptText,
          headline: 'Southern Trap 808 Style Shifter & Impact Cuts',
          summary: 'Transforms the instrumental to 140 BPM Dirty South / Atlanta trap with crushing 808 sub bass, rapid hi-hat rolls, and beat-synced zoom shake transitions.',
          timestamp: 'Just now',
          steps: [
            { id: 's1', title: 'Switch Style to Southern Trap 808', description: 'Enabled 140 BPM Memphis sub kicks and rolling snares', actionType: 'swap_style', status: 'pending', params: { style: 'southern_trap' } },
            { id: 's2', title: 'Auto-Cut Clips on 808 Drops', description: 'Split video timeline at sub-bass transient markers', actionType: 'cut_to_beat', status: 'pending' },
            { id: 's3', title: 'Attach 808 Impact Zoom Shake', description: 'Added audio-reactive camera shake on kick transients', actionType: 'add_effect', status: 'pending' },
            { id: 's4', title: 'Boost Bass Saturation', description: 'Pushed +6.5 dB analog warmth into master audio track', actionType: 'add_effect', status: 'pending' },
          ]
        };
      } else {
        // General Beat-Sync & Cinematic Video Plan
        plan = {
          id: `plan-${Date.now()}`,
          prompt: promptText,
          headline: 'AI Beat-Synced Cinematic Visual Edit',
          summary: 'Detects audio transients, aligns video clips to rhythmic peaks, applies cinematic color grading, and adds kinetic titles.',
          timestamp: 'Just now',
          steps: [
            { id: 's1', title: 'Analyze Audio Transients', description: 'Generated 6 beat markers matching song BPM and drops', actionType: 'cut_to_beat', status: 'pending' },
            { id: 's2', title: 'Align Clips to Drops', description: 'Trimmed video boundaries to snap exactly onto beat markers', actionType: 'cut_to_beat', status: 'pending' },
            { id: 's3', title: 'Apply Cinematic Hollywood Look', description: 'Graded with teal & orange separation and 2.39:1 letterbox', actionType: 'color_grade', status: 'pending' },
            { id: 's4', title: 'Insert Kinetic Title Hook', description: 'Placed dynamic caption with bass bounce pulse animation', actionType: 'add_captions', status: 'pending' },
          ]
        };
      }

      setActivePlan(plan);
      setIsGeneratingPlan(false);
      showToast('AI Edit Plan Generated! Review and apply below.', 'success');
    }, 600);
  };

  // Apply Plan to Timeline
  const handleApplyAIPlan = () => {
    if (!activePlan) return;

    let updatedClips = [...project.clips];

    activePlan.steps.forEach(step => {
      if (step.actionType === 'mute_words') {
        globalAudioEngine.muteOriginalWords();
        updatedClips = updatedClips.map(c => {
          if (c.trackId === 'track-a1' && c.audioProps) {
            return { ...c, audioProps: { ...c.audioProps, muteWords: true, volume: 1.0 } };
          }
          return c;
        });
      } else if (step.actionType === 'mute_beat') {
        globalAudioEngine.muteOriginalBeat();
        updatedClips = updatedClips.map(c => {
          if (c.trackId === 'track-a1' && c.audioProps) {
            return { ...c, audioProps: { ...c.audioProps, muteBeat: true, volume: 1.2 } };
          }
          return c;
        });
      } else if (step.actionType === 'swap_style') {
        const targetStyle = (step.params?.style as string) || 'afrobeat_lagos';
        globalAudioEngine.setSwappedInstrumental(targetStyle);
        updatedClips = updatedClips.map(c => {
          if (c.trackId === 'track-a1' && c.audioProps) {
            return { ...c, audioProps: { ...c.audioProps, styleSwap: targetStyle } };
          }
          return c;
        });
      } else if (step.actionType === 'color_grade') {
        updatedClips = updatedClips.map(c => {
          if (c.trackId === 'track-v1') {
            return {
              ...c,
              colorGrading: {
                ...c.colorGrading,
                exposure: 12,
                contrast: 22,
                saturation: 28,
                lut: 'teal_orange'
              }
            };
          }
          return c;
        });
      } else if (step.actionType === 'cut_to_beat') {
        // Auto beat sync
        handleAutoBeatSync();
      }
    });

    const newProject: VizmotionProject = {
      ...project,
      clips: updatedClips,
      activeAIPlan: {
        ...activePlan,
        steps: activePlan.steps.map(s => ({ ...s, status: 'applied' }))
      }
    };

    pushHistory(newProject);
    setActivePlan(null);
    showToast('AI Edit Plan successfully applied to timeline!', 'success');
  };

  // -------------------------------------------------------------
  // Timeline Editing Operations (Trim, Split, Move, Delete, Beat Sync)
  // -------------------------------------------------------------
  const handleSplitAtPlayhead = () => {
    if (!selectedClipId) {
      showToast('Select a clip first to split', 'info');
      return;
    }

    const targetClip = project.clips.find(c => c.id === selectedClipId);
    if (!targetClip) return;

    if (currentTime <= targetClip.startTime || currentTime >= targetClip.startTime + targetClip.duration) {
      showToast('Playhead must be inside the clip to split', 'info');
      return;
    }

    const firstDuration = currentTime - targetClip.startTime;
    const secondDuration = targetClip.duration - firstDuration;

    const clipA: TimelineClip = {
      ...targetClip,
      duration: firstDuration,
      sourceOut: targetClip.sourceIn + firstDuration,
    };

    const clipB: TimelineClip = {
      ...targetClip,
      id: `clip-${Date.now()}`,
      title: `${targetClip.title} (Part 2)`,
      startTime: currentTime,
      duration: secondDuration,
      sourceIn: targetClip.sourceIn + firstDuration,
    };

    const updatedClips = project.clips.filter(c => c.id !== selectedClipId).concat([clipA, clipB]);
    pushHistory({ ...project, clips: updatedClips });
    setSelectedClipId(clipB.id);
    showToast('Clip split at playhead', 'success');
  };

  const handleDeleteClip = (clipId: string) => {
    const updatedClips = project.clips.filter(c => c.id !== clipId);
    pushHistory({ ...project, clips: updatedClips });
    if (selectedClipId === clipId) setSelectedClipId(null);
    showToast('Clip deleted', 'info');
  };

  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    const duplicated: TimelineClip = {
      ...selectedClip,
      id: `clip-${Date.now()}`,
      title: `${selectedClip.title} (Copy)`,
      startTime: selectedClip.startTime + selectedClip.duration + 0.5,
    };
    pushHistory({ ...project, clips: [...project.clips, duplicated] });
    setSelectedClipId(duplicated.id);
    showToast('Clip duplicated', 'success');
  };

  const handleAutoBeatSync = () => {
    // Generate beat markers based on current BPM
    const bpm = 112; // Afrobeat default
    const beatInterval = 60 / bpm;
    const markers: BeatMarker[] = [];
    for (let t = 0; t < duration; t += beatInterval * 4) {
      markers.push({
        id: `bm-${Math.floor(t * 10)}`,
        time: parseFloat(t.toFixed(2)),
        label: t === 0 ? 'Start' : t > 16 && t < 18 ? 'DROP' : 'Beat',
        color: t > 16 && t < 18 ? '#ec4899' : '#ea3838',
        type: t > 16 && t < 18 ? 'drop' : 'beat'
      });
    }
    pushHistory({ ...project, markers });
    showToast('Auto-detected beats and created timeline markers!', 'success');
  };

  const handleAddMediaToTimeline = (item: StockMediaItem) => {
    let trackId = 'track-v1';
    if (item.type === 'audio' || item.type === 'sfx') trackId = 'track-a2';
    if (item.type === 'text') trackId = 'track-v3';
    if (item.type === 'effect') trackId = 'track-v2';

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId,
      title: item.title,
      type: item.type === 'sfx' ? 'audio' : item.type,
      startTime: currentTime,
      duration: item.duration || 6,
      sourceIn: 0,
      sourceOut: item.duration || 6,
      speed: 1.0,
      opacity: 1.0,
      blendMode: 'normal',
      transform: { scale: 1.0, x: 0, y: 0, rotation: 0, flipH: false, flipV: false },
      colorGrading: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, lut: 'none' },
      color: item.color,
      thumbnail: item.thumbnail,
      textProps: item.type === 'text' ? {
        text: item.meta?.text || item.title,
        fontSize: 32,
        color: '#ffffff',
        glowColor: '#ea3838',
        hasGlow: true,
        fontFamily: 'sans-serif',
        align: 'center',
        backgroundBox: true,
        animation: 'bounce'
      } : undefined,
      audioProps: (item.type === 'audio' || item.type === 'sfx') ? {
        volume: 1.0,
        muteWords: false,
        muteBeat: false,
        styleSwap: 'none',
        fadeIn: 0,
        fadeOut: 0
      } : undefined
    };

    pushHistory({ ...project, clips: [...project.clips, newClip] });
    setSelectedClipId(newClip.id);
    showToast(`Added "${item.title}" to timeline`, 'success');
  };

  // User File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');
      const itemType = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      const newItem: StockMediaItem = {
        id: `user-${Date.now()}-${Math.random()}`,
        title: file.name,
        type: itemType,
        category: 'My Uploads',
        duration: 15,
        thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=60',
        color: isVideo ? '#ea3838' : isAudio ? '#06b6d4' : '#10b981',
        description: `Imported file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`
      };

      setCustomMedia(prev => [newItem, ...prev]);
      handleAddMediaToTimeline(newItem);
    });

    showToast('File imported and placed on timeline!', 'success');
  };

  // -------------------------------------------------------------
  // Real Video Export Engine (Canvas + Audio MediaStream MediaRecorder)
  // -------------------------------------------------------------
  const handleStartExport = async () => {
    setIsRendering(true);
    setRenderProgress(5);

    const canvas = previewCanvasRef.current;
    if (!canvas) {
      setIsRendering(false);
      showToast('Preview canvas not ready', 'error');
      return;
    }

    try {
      // 1. Capture stream from canvas at 30 fps
      const canvasStream = canvas.captureStream(30);

      // 2. Mix Web Audio MediaStream from globalAudioEngine
      const audioStream = globalAudioEngine.getAudioMediaStream();
      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        combinedTracks.push(...audioStream.getAudioTracks());
      }
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: exportQuality === '4k' ? 16000000 : 8000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRenderedUrl(url);
        setIsRendering(false);
        setRenderProgress(100);
        showToast('Video export completed! Ready for download.', 'success');
      };

      // Play audio and record for 10 seconds sample render or user duration
      mediaRecorder.start(100);
      globalAudioEngine.seek(0);
      globalAudioEngine.play();

      let prog = 5;
      const interval = setInterval(() => {
        prog += 10;
        setRenderProgress(Math.min(prog, 95));
        if (prog >= 100) {
          clearInterval(interval);
          mediaRecorder.stop();
          globalAudioEngine.pause();
        }
      }, 1000);

    } catch (err) {
      console.error('Export error:', err);
      setIsRendering(false);
      showToast('Render failed in current browser environment', 'error');
    }
  };

  const handleDownloadRenderedVideo = () => {
    if (!renderedUrl) return;
    const a = document.createElement('a');
    a.href = renderedUrl;
    a.download = `${project.name.replace(/\s+/g, '_')}_VIZMOTION.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Video downloaded!', 'success');
  };

  // Filtered media items
  const allMediaItems = [...customMedia, ...STOCK_MEDIA_LIBRARY].filter(item => {
    if (mediaCategory !== 'all' && item.type !== mediaCategory && !(mediaCategory === 'audio' && item.type === 'sfx')) return false;
    if (mediaSearch.trim() && !item.title.toLowerCase().includes(mediaSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0d0405] text-[#f4e8e8] select-none overflow-hidden relative font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: VIZMOTION AI Brand, Project Name, Undo/Redo, Mode, Export */}
      {/* ------------------------------------------------------------- */}
      <header className="h-14 border-b border-[#2d0f11] bg-[#160709] px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Brand & Project Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ea3838] to-[#f59e0b] flex items-center justify-center shadow-md shadow-[#ea3838]/30">
              <Film className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                VIZMOTION AI
                <span className="px-1.5 py-0.2 rounded bg-[#ea3838]/20 border border-[#ea3838]/40 text-[#ff6b6b] text-[9px] font-mono">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-[#361315] mx-1 hidden sm:block" />

          {/* Project Title (Inline Editable) */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject(p => ({ ...p, name: e.target.value }))}
              className="bg-transparent hover:bg-[#220d0f] focus:bg-[#220d0f] px-2 py-1 rounded text-xs font-bold text-white border border-transparent focus:border-[#4d191c] transition-all max-w-[220px] truncate"
              title="Click to rename project"
            />
          </div>
        </div>

        {/* Center: Quick Action Buttons & Undo/Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo & Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
              historyIndex > 0
                ? 'bg-[#220c0e] hover:bg-[#341315] text-white border-[#3a1517]'
                : 'bg-transparent text-neutral-600 border-transparent cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Undo</span>
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
              historyIndex < history.length - 1
                ? 'bg-[#220c0e] hover:bg-[#341315] text-white border-[#3a1517]'
                : 'bg-transparent text-neutral-600 border-transparent cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Redo</span>
          </button>

          <div className="h-4 w-px bg-[#361315] mx-1" />

          {/* Quick Modals Shortcuts */}
          {onOpenInstrumentalSwapper && (
            <button
              onClick={onOpenInstrumentalSwapper}
              className="px-2.5 py-1.5 rounded-lg bg-[#280e10] hover:bg-[#3d1518] text-[#f59e0b] border border-[#f59e0b]/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Stem Swapper & African Models Suite"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Stem Swapper</span>
            </button>
          )}

          {onOpenBeatMaker && (
            <button
              onClick={onOpenBeatMaker}
              className="px-2.5 py-1.5 rounded-lg bg-[#280e10] hover:bg-[#3d1518] text-[#ec4899] border border-[#ec4899]/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open 16-Step Beat Maker & Drum Machine"
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Beat Maker</span>
            </button>
          )}

          {/* Save project */}
          <button
            onClick={() => {
              localStorage.setItem('vizmotion_saved_project', JSON.stringify(project));
              showToast('Project saved successfully!', 'success');
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#220c0e] hover:bg-[#341315] text-[#b0878a] hover:text-white border border-[#3a1517] text-xs font-medium flex items-center gap-1 transition-all"
            title="Save Project"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Save</span>
          </button>
        </div>

        {/* Right: Mode Switcher (Quick / Edit / Pro) & Export Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#200c0e] border border-[#3a1517]">
            {(['quick', 'edit', 'pro'] as EditorMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setEditorMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  editorMode === mode
                    ? 'bg-[#ea3838] text-white shadow-sm'
                    : 'text-[#a67c7f] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4d4d] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#ea3838]/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3-COLUMN MAIN STAGE: Media Library (Left) | Preview & AI Bar (Center) | Properties Inspector (Right) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* 1. MEDIA LIBRARY (LEFT COLUMN) */}
        <aside className="w-64 lg:w-72 border-r border-[#2d0f11] bg-[#140608] flex flex-col shrink-0 overflow-hidden">
          
          {/* Header & Upload Button */}
          <div className="p-3 border-b border-[#260c0e] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#ea3838]" />
                MEDIA LIBRARY
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded-lg bg-[#280e10] hover:bg-[#3d1518] border border-[#4d191c] text-[#ea3838] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                title="Import video, audio, or image"
              >
                <Upload className="w-3 h-3" />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search footage, stems, titles..."
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              className="w-full bg-[#1e0a0d] border border-[#361315] rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ea3838]"
            />

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'video', label: 'Video' },
                { id: 'audio', label: 'Stems' },
                { id: 'text', label: 'Titles' },
                { id: 'effect', label: 'Effects' },
                { id: 'sfx', label: 'SFX' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMediaCategory(cat.id as any)}
                  className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors ${
                    mediaCategory === cat.id
                      ? 'bg-[#ea3838] text-white'
                      : 'bg-[#220d0f] text-[#a67c7f] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Items Scroll Grid */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {allMediaItems.map(item => (
              <div
                key={item.id}
                className="group relative p-2 rounded-xl bg-[#1c0a0c] hover:bg-[#280e10] border border-[#311315] hover:border-[#4d191c] flex items-center gap-2.5 transition-all cursor-pointer"
                onClick={() => handleAddMediaToTimeline(item)}
              >
                {/* Media Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-[#280e10] overflow-hidden shrink-0 relative flex items-center justify-center border border-[#3a1517]">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <Film className="w-5 h-5 text-neutral-500" />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8px] font-mono text-white">
                    {item.duration}s
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate group-hover:text-[#ea3838] transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-[#a67c7f] flex items-center gap-1.5 mt-0.5">
                    <span className="px-1 rounded bg-[#2c1012] text-neutral-400 font-mono">
                      {item.category}
                    </span>
                    {item.meta?.bpm && <span>{item.meta.bpm} BPM</span>}
                  </div>
                </div>

                {/* Hover Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddMediaToTimeline(item);
                  }}
                  className="w-7 h-7 rounded-lg bg-[#ea3838] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md transition-opacity"
                  title="Add to timeline at playhead"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* 2. CENTER STAGE: VIDEO PREVIEW CANVAS + AI COMMAND BAR */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0e0405] overflow-hidden">
          
          {/* Preview Controls Header: Aspect Ratio & Playhead Timecode */}
          <div className="h-10 px-4 border-b border-[#260c0e] bg-[#140608] flex items-center justify-between text-xs shrink-0">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-500 font-bold uppercase mr-1">Aspect:</span>
              {[
                { id: '16:9', label: '16:9 (Landscape)', icon: Monitor },
                { id: '9:16', label: '9:16 (Vertical TikTok)', icon: Smartphone },
                { id: '1:1', label: '1:1 (Square)', icon: Square },
                { id: '4:5', label: '4:5 (Feed)', icon: Square },
              ].map(ratio => {
                const Icon = ratio.icon;
                const isActive = aspectRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    onClick={() => {
                      setAspectRatio(ratio.id as AspectRatio);
                      setProject(p => ({ ...p, aspectRatio: ratio.id as AspectRatio }));
                    }}
                    className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                      isActive
                        ? 'bg-[#ea3838] text-white'
                        : 'bg-[#1f0b0d] text-[#a67c7f] hover:text-white'
                    }`}
                    title={ratio.label}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{ratio.id}</span>
                  </button>
                );
              })}
            </div>

            {/* Timecode Readout & FPS */}
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-[#ea3838] font-bold">
                {new Date(currentTime * 1000).toISOString().substr(14, 5)}:
                {String(Math.floor((currentTime % 1) * 30)).padStart(2, '0')}
              </span>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400">
                {new Date(duration * 1000).toISOString().substr(14, 5)}:00
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#200c0e] text-neutral-400 text-[10px]">
                30 FPS
              </span>
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="flex-1 flex items-center justify-center p-3 overflow-hidden relative bg-black/60">
            <div
              className={`relative shadow-2xl rounded-2xl overflow-hidden border border-[#341315] flex items-center justify-center bg-black transition-all ${
                aspectRatio === '16:9'
                  ? 'w-full max-w-[720px] aspect-[16/9]'
                  : aspectRatio === '9:16'
                  ? 'h-full max-h-[460px] aspect-[9/16]'
                  : 'w-full max-w-[440px] aspect-square'
              }`}
            >
              <canvas
                ref={previewCanvasRef}
                width={aspectRatio === '9:16' ? 1080 : 1920}
                height={aspectRatio === '9:16' ? 1920 : 1080}
                className="w-full h-full object-contain"
              />

              {/* Floating Center Transport Overlay when paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute w-14 h-14 rounded-full bg-[#ea3838]/90 hover:bg-[#ea3838] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all backdrop-blur-sm"
                  title="Play Preview"
                >
                  <Play className="w-6 h-6 fill-white ml-1" />
                </button>
              )}
            </div>
          </div>

          {/* Transport Bar (Play/Pause, Step, Scrub) */}
          <div className="h-10 px-4 border-t border-[#260c0e] bg-[#140608] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSeek(currentTime - 1.0)}
                className="p-1 rounded-lg hover:bg-[#280e10] text-[#a67c7f] hover:text-white"
                title="Step Back 1s"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="px-3 py-1 rounded-lg bg-[#ea3838] hover:bg-[#ff4d4d] text-white font-bold flex items-center gap-1.5 shadow-md shadow-[#ea3838]/20"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>
              <button
                onClick={() => handleSeek(currentTime + 1.0)}
                className="p-1 rounded-lg hover:bg-[#280e10] text-[#a67c7f] hover:text-white"
                title="Step Forward 1s"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1 rounded-lg transition-colors ${
                  isLooping ? 'text-[#ea3838]' : 'text-neutral-500'
                }`}
                title="Toggle Loop"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="text-[11px] text-[#a67c7f] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Audio Engine: {globalAudioEngine.getStemMode().toUpperCase()}</span>
            </div>
          </div>

          {/* AI COMMAND BAR (PART 3 & PART 5 OF PRD) */}
          <div className="p-3 border-t border-[#2d0f11] bg-[#18080a] shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Describe the edit you want (e.g. 'Mute original words and swap beat to Afrobeat')..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecuteAICommand(aiPrompt)}
                  className="w-full bg-[#100406] border border-[#3e1618] focus:border-[#ea3838] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#785356] focus:outline-none transition-all pr-10"
                />
                <button
                  onClick={() => handleExecuteAICommand(aiPrompt)}
                  disabled={isGeneratingPlan || !aiPrompt.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-[#ea3838] hover:bg-[#ff4d4d] disabled:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center transition-all"
                  title="Generate AI Edit Plan"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Smart Prompt Suggestions Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {[
                'Mute original words & swap beat to Afrobeat',
                'Mute beat (Acapella Words Only)',
                'Southern Trap 808 Style Shifter',
                'Cut footage to strongest beats',
                'Teal & orange Hollywood color grade',
                'Add kinetic glowing TikTok subtitles',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiPrompt(chip);
                    handleExecuteAICommand(chip);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#220d0f] hover:bg-[#321315] border border-[#361315] hover:border-[#ea3838]/60 text-[#d8a8ab] hover:text-white whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 text-[#f59e0b]" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            {/* Generated AI Edit Plan Confirmation Box */}
            {activePlan && (
              <div className="rounded-xl p-3 bg-gradient-to-r from-[#200c0e] to-[#160809] border border-[#f59e0b]/40 shadow-lg space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#f59e0b] text-black text-[9px] font-black uppercase tracking-wider">
                      AI PROPOSED PLAN
                    </span>
                    <span className="text-xs font-bold text-white">{activePlan.headline}</span>
                  </div>
                  <button
                    onClick={() => setActivePlan(null)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-[#e6bca0] leading-relaxed">
                  {activePlan.summary}
                </p>

                {/* 4 Structured Steps */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {activePlan.steps.map((st, i) => (
                    <div key={st.id} className="p-1.5 rounded-lg bg-[#280e10] border border-[#3a1517] text-[10px]">
                      <div className="font-bold text-white truncate">
                        {i + 1}. {st.title}
                      </div>
                      <div className="text-[#a67c7f] truncate mt-0.5">{st.description}</div>
                    </div>
                  ))}
                </div>

                {/* Confirm Apply Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setActivePlan(null)}
                    className="px-3 py-1 rounded-lg bg-[#240e10] hover:bg-[#341315] text-neutral-400 hover:text-white text-xs font-bold"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleApplyAIPlan}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Apply Plan to Timeline
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. PROPERTIES INSPECTOR (RIGHT COLUMN) */}
        <aside className="w-72 lg:w-80 border-l border-[#2d0f11] bg-[#140608] flex flex-col shrink-0 overflow-hidden">
          
          {/* Header */}
          <div className="p-3 border-b border-[#260c0e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#ea3838]" />
                PROPERTIES INSPECTOR
              </span>
              {selectedClip && (
                <span className="px-1.5 py-0.5 rounded bg-[#2c1012] text-[#ea3838] text-[10px] font-mono">
                  {selectedClip.type.toUpperCase()}
                </span>
              )}
            </div>

            {/* Inspector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-[#1e0a0d] border border-[#341315] text-[10px] font-bold">
              {[
                { id: 'transform', label: 'Transform' },
                { id: 'color', label: 'Color' },
                { id: 'audio', label: 'Audio' },
                { id: 'effects', label: 'FX' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setInspectorTab(t.id as any)}
                  className={`py-1 rounded-lg transition-colors ${
                    inspectorTab === t.id
                      ? 'bg-[#ea3838] text-white'
                      : 'text-[#a67c7f] hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Properties Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {selectedClip ? (
              <>
                {/* Clip Title Banner */}
                <div className="p-2.5 rounded-xl bg-[#1f0b0d] border border-[#341315] space-y-1">
                  <div className="text-xs font-bold text-white truncate">{selectedClip.title}</div>
                  <div className="text-[10px] text-[#a67c7f] flex items-center justify-between font-mono">
                    <span>Start: {selectedClip.startTime.toFixed(1)}s</span>
                    <span>Dur: {selectedClip.duration.toFixed(1)}s</span>
                  </div>
                </div>

                {/* TAB 1: TRANSFORM & SPEED */}
                {inspectorTab === 'transform' && (
                  <div className="space-y-3.5 text-xs">
                    {/* Scale Slider */}
                    <div>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>Scale:</span>
                        <span className="text-white font-mono">{selectedClip.transform.scale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="2.5"
                        step="0.05"
                        value={selectedClip.transform.scale}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setProject(p => ({
                            ...p,
                            clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, transform: { ...c.transform, scale: val } } : c)
                          }));
                        }}
                        className="w-full accent-[#ea3838]"
                      />
                    </div>

                    {/* Position X / Y */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>X:</span>
                          <span className="text-white font-mono">{selectedClip.transform.x}px</span>
                        </div>
                        <input
                          type="range"
                          min="-400"
                          max="400"
                          step="10"
                          value={selectedClip.transform.x}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setProject(p => ({
                              ...p,
                              clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, transform: { ...c.transform, x: val } } : c)
                            }));
                          }}
                          className="w-full accent-[#ea3838]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-neutral-400 mb-1">
                          <span>Y:</span>
                          <span className="text-white font-mono">{selectedClip.transform.y}px</span>
                        </div>
                        <input
                          type="range"
                          min="-400"
                          max="400"
                          step="10"
                          value={selectedClip.transform.y}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setProject(p => ({
                              ...p,
                              clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, transform: { ...c.transform, y: val } } : c)
                            }));
                          }}
                          className="w-full accent-[#ea3838]"
                        />
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>Opacity:</span>
                        <span className="text-white font-mono">{Math.round(selectedClip.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedClip.opacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setProject(p => ({
                            ...p,
                            clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, opacity: val } : c)
                          }));
                        }}
                        className="w-full accent-[#ea3838]"
                      />
                    </div>

                    {/* Speed Controls */}
                    <div>
                      <div className="text-neutral-400 mb-1.5">Speed Multiplier:</div>
                      <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                        {[0.5, 1.0, 1.5, 2.0].map(sp => (
                          <button
                            key={sp}
                            onClick={() => {
                              setProject(p => ({
                                ...p,
                                clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, speed: sp } : c)
                              }));
                            }}
                            className={`py-1 rounded-lg transition-colors ${
                              selectedClip.speed === sp
                                ? 'bg-[#ea3838] text-white'
                                : 'bg-[#200c0e] text-[#a67c7f] hover:text-white'
                            }`}
                          >
                            {sp}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: COLOR GRADING & LUTS */}
                {inspectorTab === 'color' && (
                  <div className="space-y-3.5 text-xs">
                    {/* Exposure */}
                    <div>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>Exposure:</span>
                        <span className="text-white font-mono">{selectedClip.colorGrading.exposure}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={selectedClip.colorGrading.exposure}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProject(p => ({
                            ...p,
                            clips: p.clips.map(c => c.id === selectedClip.id ? {
                              ...c,
                              colorGrading: { ...c.colorGrading, exposure: val }
                            } : c)
                          }));
                        }}
                        className="w-full accent-[#ea3838]"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>Contrast:</span>
                        <span className="text-white font-mono">{selectedClip.colorGrading.contrast}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={selectedClip.colorGrading.contrast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProject(p => ({
                            ...p,
                            clips: p.clips.map(c => c.id === selectedClip.id ? {
                              ...c,
                              colorGrading: { ...c.colorGrading, contrast: val }
                            } : c)
                          }));
                        }}
                        className="w-full accent-[#ea3838]"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>Saturation:</span>
                        <span className="text-white font-mono">{selectedClip.colorGrading.saturation}</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={selectedClip.colorGrading.saturation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProject(p => ({
                            ...p,
                            clips: p.clips.map(c => c.id === selectedClip.id ? {
                              ...c,
                              colorGrading: { ...c.colorGrading, saturation: val }
                            } : c)
                          }));
                        }}
                        className="w-full accent-[#ea3838]"
                      />
                    </div>

                    {/* LUT Presets */}
                    <div>
                      <div className="text-neutral-400 mb-1.5">Cinematic LUT Presets:</div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                        {[
                          { id: 'none', label: 'Standard Rec.709' },
                          { id: 'teal_orange', label: 'Teal & Orange' },
                          { id: 'cyberpunk', label: 'Cyberpunk Neon' },
                          { id: 'noir', label: 'Film Noir B&W' },
                        ].map(l => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setProject(p => ({
                                ...p,
                                clips: p.clips.map(c => c.id === selectedClip.id ? {
                                  ...c,
                                  colorGrading: { ...c.colorGrading, lut: l.id as any }
                                } : c)
                              }));
                            }}
                            className={`p-1.5 rounded-lg border text-left transition-colors ${
                              selectedClip.colorGrading.lut === l.id
                                ? 'bg-[#ea3838]/20 border-[#ea3838] text-white'
                                : 'bg-[#1f0b0d] border-[#341315] text-[#a67c7f] hover:text-white'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AUDIO CONTROLS (CRUCIAL STEM MUTING & STYLE SHIFTER) */}
                {inspectorTab === 'audio' && (
                  <div className="space-y-4 text-xs">
                    {/* Volume Slider */}
                    <div>
                      <div className="flex justify-between text-neutral-400 mb-1">
                        <span>Track Volume:</span>
                        <span className="text-white font-mono">100%</span>
                      </div>
                      <input type="range" min="0" max="1.5" step="0.05" defaultValue="1" className="w-full accent-[#ea3838]" />
                    </div>

                    {/* Stem Isolation Toggles */}
                    <div className="p-3 rounded-xl bg-[#200c0e] border border-[#3e1618] space-y-2.5">
                      <div className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-[#f59e0b]" />
                        NEURAL STEM ISOLATION
                      </div>

                      {/* Mute Original Words Button */}
                      <button
                        onClick={() => {
                          globalAudioEngine.muteOriginalWords();
                          showToast('Muted Original Words (Karaoke Instrumental Active)', 'success');
                        }}
                        className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                          globalAudioEngine.getStemMode() === 'words_muted'
                            ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                            : 'bg-[#19090b] border-[#361315] text-[#d8a8ab] hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">Mute Original Words</div>
                          <div className="text-[10px] text-rose-300/80">Karaoke / Words Silenced</div>
                        </div>
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      </button>

                      {/* Mute Original Beat Button */}
                      <button
                        onClick={() => {
                          globalAudioEngine.muteOriginalBeat();
                          showToast('Muted Original Beat (Pure Acapella Words Active)', 'success');
                        }}
                        className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                          globalAudioEngine.getStemMode() === 'words_only'
                            ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-md'
                            : 'bg-[#19090b] border-[#361315] text-[#d8a8ab] hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">Mute Original Beat</div>
                          <div className="text-[10px] text-cyan-300/80">Acapella / Pure Singing Words</div>
                        </div>
                        <Mic className="w-4 h-4 text-cyan-400" />
                      </button>

                      {/* Restore Full Mix */}
                      <button
                        onClick={() => {
                          globalAudioEngine.restoreFullMix();
                          showToast('Restored Full Original Master Audio', 'info');
                        }}
                        className="w-full py-1.5 rounded-lg bg-[#2a1012] hover:bg-[#381619] text-[#a67c7f] hover:text-white text-[11px] font-bold text-center transition-colors"
                      >
                        Restore Full Master Audio
                      </button>
                    </div>

                    {/* Style Shifter */}
                    <div className="space-y-1.5">
                      <div className="text-neutral-400">Change Music Style (Instrumental):</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                        {[
                          { id: 'afrobeat_lagos', label: 'Lagos Afrobeat' },
                          { id: 'southern_trap', label: 'Southern Trap 808' },
                          { id: 'amapiano_logdrum', label: 'Amapiano Bacardi' },
                          { id: 'southern_gqom', label: 'Durban Gqom' },
                          { id: 'soukous_sebene', label: 'Soukous Sebene' },
                          { id: 'uk_drill', label: 'UK Drill 142' },
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => {
                              globalAudioEngine.changeMusicStyle(st.id);
                              showToast(`Swapped music style to ${st.label}`, 'success');
                            }}
                            className="p-1.5 rounded-lg bg-[#200c0e] hover:bg-[#341315] border border-[#361315] text-[#d8a8ab] hover:text-white text-left transition-colors truncate"
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: EFFECTS */}
                {inspectorTab === 'effects' && (
                  <div className="space-y-2 text-xs">
                    <div className="text-neutral-400 mb-1">Applied Shaders & Filters:</div>
                    {[
                      { name: 'Teal & Orange Hollywood LUT', icon: Sparkles, active: true },
                      { name: '808 Bass Impact Zoom Shake', icon: Zap, active: true },
                      { name: 'Retro Phosphor CRT Scanlines', icon: Film, active: false },
                      { name: 'Analog 35mm Film Grain', icon: Flame, active: false },
                    ].map((fx, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#1e0a0d] border border-[#341315] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <fx.icon className="w-3.5 h-3.5 text-[#ea3838]" />
                          <span className="font-bold text-white text-[11px]">{fx.name}</span>
                        </div>
                        <input type="checkbox" defaultChecked={fx.active} className="accent-[#ea3838]" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-500 text-xs p-4">
                <Sliders className="w-8 h-8 mb-2 opacity-30" />
                <span>Select a clip on the timeline below to inspect and customize properties</span>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM PANEL: MULTITRACK TIMELINE (PART 3 OF PRD) */}
      {/* ------------------------------------------------------------- */}
      <footer className="h-64 lg:h-72 border-t border-[#2d0f11] bg-[#140608] flex flex-col shrink-0 overflow-hidden z-10">
        
        {/* Timeline Tools Header */}
        <div className="h-10 px-4 border-b border-[#260c0e] bg-[#19080a] flex items-center justify-between text-xs shrink-0">
          
          {/* Editing Tools (Split, Duplicate, Delete, Beat Sync) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleSplitAtPlayhead}
              className="px-2.5 py-1 rounded-lg bg-[#280e10] hover:bg-[#3d1518] text-white border border-[#4d191c] font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Split Clip at Playhead (S)"
            >
              <Scissors className="w-3.5 h-3.5 text-[#ea3838]" />
              <span>Split (S)</span>
            </button>

            <button
              onClick={handleDuplicateClip}
              disabled={!selectedClipId}
              className="px-2.5 py-1 rounded-lg bg-[#220d0f] hover:bg-[#341315] disabled:opacity-40 text-neutral-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Duplicate Selected Clip"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            <button
              onClick={() => selectedClipId && handleDeleteClip(selectedClipId)}
              disabled={!selectedClipId}
              className="px-2.5 py-1 rounded-lg bg-[#220d0f] hover:bg-[#401215] disabled:opacity-40 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Delete Clip (Delete/Backspace)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <div className="h-4 w-px bg-[#361315] mx-1" />

            {/* Beat Sync Detection */}
            <button
              onClick={handleAutoBeatSync}
              className="px-2.5 py-1 rounded-lg bg-[#280e10] hover:bg-[#3d1518] border border-[#f59e0b]/40 text-[#f59e0b] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Auto-detect BPM beats and generate markers"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Beat Sync</span>
            </button>

            <button
              onClick={() => setIsSnapping(!isSnapping)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                isSnapping ? 'bg-[#ea3838]/20 text-[#ea3838] border border-[#ea3838]/40' : 'text-neutral-500'
              }`}
              title="Toggle Snapping (N)"
            >
              Magnet
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 font-bold">Zoom:</span>
            <input
              type="range"
              min="10"
              max="60"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-20 accent-[#ea3838]"
              title="Timeline Zoom"
            />
          </div>
        </div>

        {/* Multitrack Scrollable Workspace */}
        <div 
          ref={timelineContainerRef}
          className="flex-1 flex overflow-x-auto overflow-y-auto relative bg-[#100406]"
        >
          {/* Left: Track Headers (V3, V2, V1, A1, A2) */}
          <div className="w-44 lg:w-48 bg-[#160709] border-r border-[#2d0f11] shrink-0 sticky left-0 z-20 select-none">
            {/* Corner header matching time ruler */}
            <div className="h-6 border-b border-[#2d0f11] bg-[#1a090b] px-2 flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span>TRACKS</span>
              <span>ROUTING</span>
            </div>

            {project.tracks.map(tr => (
              <div
                key={tr.id}
                className="h-10 border-b border-[#240b0e] px-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${
                    tr.type === 'text' ? 'bg-[#ec4899]' :
                    tr.type === 'effect' ? 'bg-[#06b6d4]' :
                    tr.type === 'video' ? 'bg-[#ea3838]' : 'bg-[#10b981]'
                  }`} />
                  <span className="font-bold text-white text-[11px] truncate">{tr.name}</span>
                </div>

                <div className="flex items-center gap-1 text-neutral-500">
                  <button className="hover:text-white p-0.5"><Eye className="w-3 h-3" /></button>
                  <button className="hover:text-white p-0.5"><Volume2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Interactive Timeline Body (Ruler + Tracks + Playhead) */}
          <div 
            className="flex-1 relative min-w-[1200px]"
            style={{ width: `${Math.max(1200, duration * zoomLevel + 100)}px` }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newTime = Math.max(0, clickX / zoomLevel);
              handleSeek(newTime);
            }}
          >
            {/* Time Ruler */}
            <div className="h-6 border-b border-[#2d0f11] bg-[#1a090b] relative pointer-events-none">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-[#3a1517] text-[9px] font-mono text-neutral-500 pl-1"
                  style={{ left: `${sec * zoomLevel}px` }}
                >
                  {sec % 2 === 0 ? `${sec}s` : ''}
                </div>
              ))}

              {/* Beat Markers on Ruler */}
              {project.markers.map(bm => (
                <div
                  key={bm.id}
                  className="absolute top-0 bottom-0 flex flex-col items-center z-10"
                  style={{ left: `${bm.time * zoomLevel}px` }}
                >
                  <div
                    className="px-1 py-0.2 rounded text-[8px] font-black uppercase text-black"
                    style={{ backgroundColor: bm.color }}
                  >
                    {bm.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Draggable Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#ea3838] shadow-[0_0_8px_#ea3838] z-30 pointer-events-none"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              <div className="w-3 h-3 bg-[#ea3838] -ml-1.5 -mt-1 rounded-sm rotate-45" />
            </div>

            {/* Multitrack Lanes */}
            {project.tracks.map(tr => {
              const trackClips = project.clips.filter(c => c.trackId === tr.id);
              return (
                <div
                  key={tr.id}
                  className="h-10 border-b border-[#240b0e] relative bg-[#120507]/60"
                >
                  {trackClips.map(clip => {
                    const isSelected = selectedClipId === clip.id;
                    const left = clip.startTime * zoomLevel;
                    const width = Math.max(20, clip.duration * zoomLevel);

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between text-[11px] font-bold overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-white shadow-lg z-20'
                            : 'hover:brightness-110'
                        }`}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          backgroundColor: clip.color,
                          color: '#ffffff',
                        }}
                      >
                        <span className="truncate drop-shadow">{clip.title}</span>
                        <span className="text-[9px] font-mono opacity-80 shrink-0 ml-1">
                          {clip.duration.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* EXPORT / RENDER MODAL */}
      {/* ------------------------------------------------------------- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#160709] border border-[#3e1618] p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-[#2f1013] pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-[#ea3838]" />
                <h3 className="text-lg font-black uppercase tracking-tight">EXPORT & RENDER VIDEO</h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1 text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 font-bold block mb-1.5">Resolution Preset:</label>
                <div className="grid grid-cols-3 gap-2 font-bold">
                  {[
                    { id: '1080p', label: '1080p Full HD' },
                    { id: '4k', label: '4K Cinema' },
                    { id: '720p', label: '720p Fast' },
                  ].map(res => (
                    <button
                      key={res.id}
                      onClick={() => setExportQuality(res.id as any)}
                      className={`py-2 rounded-xl border text-center transition-all ${
                        exportQuality === res.id
                          ? 'bg-[#ea3838] border-[#ea3838] text-white shadow-md'
                          : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-400 font-bold block mb-1.5">Output Format:</label>
                <div className="grid grid-cols-2 gap-2 font-bold">
                  {[
                    { id: 'webm', label: 'WebM (Native VP9 Audio/Video)' },
                    { id: 'mp4', label: 'MP4 (Universal Delivery)' },
                  ].map(fmt => (
                    <button
                      key={fmt.id}
                      onClick={() => setExportFormat(fmt.id as any)}
                      className={`py-2 rounded-xl border text-center transition-all ${
                        exportFormat === fmt.id
                          ? 'bg-[#ea3838] border-[#ea3838] text-white shadow-md'
                          : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Render Progress */}
              {isRendering && (
                <div className="space-y-2 p-3 rounded-xl bg-[#200c0e] border border-[#3e1618]">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>Rendering Canvas & Audio Streams...</span>
                    <span>{renderProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#100406] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ea3838] to-[#f59e0b] transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Rendered Video Ready Box */}
              {renderedUrl && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                  <span className="font-bold">Render completed successfully!</span>
                  <button
                    onClick={handleDownloadRenderedVideo}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2f1013]">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#220d0f] hover:bg-[#341315] text-[#b0878a] hover:text-white text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={handleStartExport}
                disabled={isRendering}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4d4d] hover:brightness-110 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#ea3838]/30 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isRendering ? 'Rendering...' : 'Start Render'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce border ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
            : toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-500/50'
            : 'bg-[#280e10] text-[#f4e8e8] border-[#ea3838]/50'
        }`}>
          <Sparkles className="w-4 h-4 text-[#ea3838]" />
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
};
