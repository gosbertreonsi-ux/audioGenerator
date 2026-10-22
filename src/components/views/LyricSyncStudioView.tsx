/**
 * MIZIZI STUDIO - VERSION B: LYRIC & MUSIC ALIGNMENT STUDIO
 * PRD Section 2.2 C: Lyric video creation, word/line synchronization,
 * typography styling, pitch/frequency controls, and video export.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Video,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Sliders,
  Type,
  Palette,
  Eye,
  Check,
  Sparkles,
  Layers,
  Activity,
  Plus,
  Trash2,
  Clock,
  Zap,
  Film,
  Maximize2
} from 'lucide-react';
import { LyricLine, LyricVideoConfig, AudioTrack } from '../../types';
import { globalAudioEngine } from '../../lib/audioEngine';

interface LyricSyncStudioViewProps {
  currentTrack?: AudioTrack;
  onNavigateTab?: (tab: string) => void;
}

export const LyricSyncStudioView: React.FC<LyricSyncStudioViewProps> = ({
  currentTrack,
  onNavigateTab,
}) => {
  // Preset default lyrics (Ariana Grande - bye style sync)
  const [lyrics, setLyrics] = useState<LyricLine[]>([
    { id: 'l1', text: "bye... bye...", startTime: 0.0, endTime: 3.8 },
    { id: 'l2', text: "boy, bye... yeah...", startTime: 4.0, endTime: 7.9 },
    { id: 'l3', text: "it's time to let the music breathe", startTime: 8.0, endTime: 11.5 },
    { id: 'l4', text: "locked to the exact same frequency", startTime: 12.0, endTime: 15.8 },
    { id: 'l5', text: "mizizi studio beat & vocal sync", startTime: 16.0, endTime: 19.8 },
    { id: 'l6', text: "never looked back, never looked down", startTime: 20.0, endTime: 24.5 },
    { id: 'l7', text: "bye... boy, bye...", startTime: 25.0, endTime: 30.0 },
  ]);

  const [rawPastedLyrics, setRawPastedLyrics] = useState('');
  const [activeLineIndex, setActiveLineIndex] = useState(0);

  // Audio Playback & Transport State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.5x - 1.5x
  const [pitchSemitones, setPitchSemitones] = useState(0); // -6 to +6
  const [vocalClarityEq, setVocalClarityEq] = useState(3.0); // dB boost at 3kHz

  // Audio Context & Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeStampRef = useRef<number>(0);
  const playheadOffsetRef = useRef<number>(0);

  // Styling Config
  const [config, setConfig] = useState<LyricVideoConfig>({
    fontFamily: 'Space Grotesk',
    fontSize: 36,
    textColor: '#ffffff',
    highlightColor: '#ea3838',
    textAlign: 'center',
    positionY: 55,
    animationStyle: 'karaoke_glow',
    aspectRatio: '9:16', // TikTok / Reels / Shorts standard
    backgroundType: 'preset_motion',
    backgroundUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80',
    backgroundDim: 0.45,
    backgroundBlur: 4,
    uppercase: true,
  });

  // Background Media Upload
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);

  // Canvas Video Rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  // Load Background Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = customBgUrl || config.backgroundUrl;
    img.onload = () => {
      bgImageRef.current = img;
      renderCanvasFrame(currentTime);
    };
  }, [config.backgroundUrl, customBgUrl]);

  // Initialize Synthetic Demo Audio Buffer if none loaded
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const sampleRate = ctx.sampleRate;
    const dur = 30.0;
    const buf = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
    const c0 = buf.getChannelData(0);
    const c1 = buf.getChannelData(1);

    // Warm chords & beat synthesis (120 BPM)
    const bpm = 120;
    const beatSec = 60 / bpm;
    for (let i = 0; i < buf.length; i++) {
      const t = i / sampleRate;
      const beat = (t / beatSec) % 4;

      // Soft kick on beat 0 and 2
      let kick = 0;
      if (beat < 0.25 || (beat >= 2 && beat < 2.25)) {
        const kt = (beat % 2) * beatSec;
        kick = Math.sin(2 * Math.PI * (55 + 60 * Math.exp(-kt * 20)) * kt) * Math.exp(-kt * 6) * 0.7;
      }

      // Snare on beat 1 and 3
      let snare = 0;
      if ((beat >= 1 && beat < 1.3) || (beat >= 3 && beat < 3.3)) {
        const st = ((beat - 1) % 2) * beatSec;
        snare = (Math.random() * 2 - 1) * Math.exp(-st * 15) * 0.4;
      }

      // Chords (F minor - F, Ab, C)
      const f1 = 174.61;
      const f2 = 207.65;
      const f3 = 261.63;
      const chords = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t) + Math.sin(2 * Math.PI * f3 * t)) * 0.08;

      const sig = Math.max(-0.95, Math.min(0.95, kick + snare + chords));
      c0[i] = sig;
      c1[i] = sig;
    }
    audioBufferRef.current = buf;
    setDuration(dur);
  }, []);

  // Transport Controls
  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(currentTime);
    }
  };

  const playAudio = (startSec: number) => {
    if (!audioCtxRef.current || !audioBufferRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (_) {}
    }

    const src = ctx.createBufferSource();
    src.buffer = audioBufferRef.current;
    src.playbackRate.value = playbackSpeed * Math.pow(2, pitchSemitones / 12);

    // Vocal clarity EQ filter
    const eq = ctx.createBiquadFilter();
    eq.type = 'peaking';
    eq.frequency.value = 3200;
    eq.Q.value = 1.2;
    eq.gain.value = vocalClarityEq;

    src.connect(eq);
    eq.connect(ctx.destination);

    const offset = Math.min(startSec, duration);
    src.start(0, offset);
    audioSourceRef.current = src;

    startTimeStampRef.current = ctx.currentTime - (offset / src.playbackRate.value);
    playheadOffsetRef.current = offset;
    setIsPlaying(true);

    // Animation frame loop for playhead & canvas
    const updateLoop = () => {
      if (!audioCtxRef.current) return;
      const elapsed = (audioCtxRef.current.currentTime - startTimeStampRef.current) * (playbackSpeed * Math.pow(2, pitchSemitones / 12));
      const newTime = Math.min(duration, Math.max(0, elapsed));
      setCurrentTime(newTime);
      renderCanvasFrame(newTime);

      // Determine active lyric line
      const currIdx = lyrics.findIndex((l) => newTime >= l.startTime && newTime <= l.endTime);
      if (currIdx !== -1) setActiveLineIndex(currIdx);

      if (newTime >= duration) {
        pauseAudio();
        setCurrentTime(0);
      } else {
        animFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };
    animFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const pauseAudio = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (_) {}
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
  };

  const seek = (newSec: number) => {
    const clamped = Math.max(0, Math.min(duration, newSec));
    setCurrentTime(clamped);
    renderCanvasFrame(clamped);
    if (isPlaying) {
      pauseAudio();
      playAudio(clamped);
    }
  };

  // Tap-to-Sync: Stamps current playhead timestamp onto the active line
  const handleTapToSync = () => {
    if (activeLineIndex >= lyrics.length) return;
    setLyrics((prev) => {
      const copy = [...prev];
      const line = { ...copy[activeLineIndex] };
      line.startTime = Math.round(currentTime * 10) / 10;
      line.endTime = Math.round((currentTime + 3.5) * 10) / 10;
      line.isRecorded = true;
      copy[activeLineIndex] = line;
      return copy;
    });
    // Advance to next line
    if (activeLineIndex < lyrics.length - 1) {
      setActiveLineIndex(activeLineIndex + 1);
    }
  };

  // Parse pasted lyrics into lines
  const handleParseLyrics = () => {
    if (!rawPastedLyrics.trim()) return;
    const lines = rawPastedLyrics
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const step = duration / Math.max(1, lines.length);
    const newItems: LyricLine[] = lines.map((text, i) => ({
      id: `line_${Date.now()}_${i}`,
      text: text,
      startTime: Math.round(i * step * 10) / 10,
      endTime: Math.round((i * step + step * 0.9) * 10) / 10,
    }));

    setLyrics(newItems);
    setActiveLineIndex(0);
    setRawPastedLyrics('');
  };

  // Canvas Frame Renderer
  const renderCanvasFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Background
    if (bgImageRef.current && bgImageRef.current.complete) {
      ctx.drawImage(bgImageRef.current, 0, 0, w, h);
    } else {
      // Warm dark gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a080a');
      grad.addColorStop(0.5, '#2e0e12');
      grad.addColorStop(1, '#0a0304');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Background Dimmer & Blur
    ctx.fillStyle = `rgba(10, 3, 4, ${config.backgroundDim})`;
    ctx.fillRect(0, 0, w, h);

    // 3. Find Current and Upcoming Lines
    const currentLine = lyrics.find((l) => time >= l.startTime && time <= l.endTime);
    const nextLine = lyrics.find((l) => l.startTime > time && l.startTime <= time + 4);

    // 4. Render Active Lyric Line
    if (currentLine) {
      const lineDuration = currentLine.endTime - currentLine.startTime;
      const progress = Math.max(0, Math.min(1, (time - currentLine.startTime) / lineDuration));

      const text = config.uppercase ? currentLine.text.toUpperCase() : currentLine.text;
      const posY = (h * config.positionY) / 100;

      ctx.save();
      ctx.textAlign = config.textAlign;
      ctx.font = `900 ${config.fontSize}px '${config.fontFamily}', sans-serif`;

      const posX = config.textAlign === 'center' ? w / 2 : config.textAlign === 'left' ? w * 0.1 : w * 0.9;

      // Drop shadow for crisp readability
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Base un-highlighted text
      ctx.fillStyle = config.textColor;
      ctx.fillText(text, posX, posY);

      // Karaoke Glow Animation (Sweeps across the text)
      if (config.animationStyle === 'karaoke_glow') {
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;

        const leftEdge = posX - (config.textAlign === 'center' ? textWidth / 2 : 0);
        const highlightWidth = textWidth * progress;

        ctx.save();
        ctx.beginPath();
        ctx.rect(leftEdge, posY - config.fontSize, highlightWidth, config.fontSize * 1.5);
        ctx.clip();

        ctx.shadowColor = config.highlightColor;
        ctx.shadowBlur = 24;
        ctx.fillStyle = config.highlightColor;
        ctx.fillText(text, posX, posY);
        ctx.restore();
      }

      ctx.restore();
    }

    // 5. Render Next Line Preview (Ghosted)
    if (nextLine && !currentLine) {
      const text = config.uppercase ? nextLine.text.toUpperCase() : nextLine.text;
      const posY = (h * config.positionY) / 100;

      ctx.save();
      ctx.textAlign = config.textAlign;
      ctx.font = `700 ${config.fontSize * 0.8}px '${config.fontFamily}', sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const posX = config.textAlign === 'center' ? w / 2 : config.textAlign === 'left' ? w * 0.1 : w * 0.9;
      ctx.fillText(text, posX, posY);
      ctx.restore();
    }
  };

  // Export Lyric Video via MediaRecorder
  const handleExportLyricVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !audioCtxRef.current || !audioBufferRef.current) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      pauseAudio();

      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 3000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setExportedVideoUrl(url);
        setIsExporting(false);
      };

      recorder.start();

      // Play through from 0 to end while recording
      seek(0);
      playAudio(0);

      const checkInterval = setInterval(() => {
        if (!isPlaying || currentTime >= duration - 0.5) {
          recorder.stop();
          pauseAudio();
          clearInterval(checkInterval);
        } else {
          setExportProgress(Math.round((currentTime / duration) * 100));
        }
      }, 500);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#120608] text-[#f4e8e8] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header / HUD */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#240a0e] via-[#1a0709] to-[#2c0e12] border border-[#ea3838]/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#ea3838]/30">
              MIZIZI CREATIVE STUDIO · SECTION 2.2 C
            </span>
            <span className="text-[11px] text-[#a67c7f]">
              Lyric Video Creator & Music Synchronization
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            LYRIC & MUSIC ALIGNMENT STUDIO
          </h1>
          <p className="text-xs text-[#a67c7f] max-w-2xl leading-relaxed">
            Align lyrics line-by-line with audio beats, style typography with karaoke glow, control pitch and frequency, and export ready-to-share social lyric videos.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportLyricVideo}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#ea3838]/30 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-white" />
                <span>Recording Video ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>Export 9:16 Lyric Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Canvas & Controls, Right Timeline & Lyrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canvas Preview Player & Audio Spectrum Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Canvas Video Preview Box */}
          <div className="p-4 rounded-3xl bg-[#19080a] border border-[#391518] shadow-xl flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#ea3838]" />
                Live Lyric Canvas ({config.aspectRatio})
              </span>
              <div className="flex gap-1.5">
                {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig({ ...config, aspectRatio: ratio })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      config.aspectRatio === ratio ? 'bg-[#ea3838] text-white' : 'bg-[#290e11] text-[#a67c7f]'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-[#44161a] shadow-2xl flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={config.aspectRatio === '9:16' ? 360 : config.aspectRatio === '16:9' ? 640 : 400}
                height={config.aspectRatio === '9:16' ? 640 : config.aspectRatio === '16:9' ? 360 : 400}
                className="max-h-[460px] w-auto object-contain"
              />
            </div>

            {/* Transport & Playhead Controls */}
            <div className="w-full space-y-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] text-white text-xs font-black shadow-md cursor-pointer active:scale-95 hover:brightness-110"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  onClick={handleTapToSync}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md cursor-pointer active:scale-95 transition-all"
                  title="Press while listening to stamp the current time onto the active lyric line!"
                >
                  <Clock className="w-4 h-4" />
                  <span>TAP TO SYNC LINE</span>
                </button>

                <div className="text-xs font-mono text-[#ff7b82] font-bold">
                  {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                </div>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#260e11] rounded-lg accent-[#ea3838] cursor-pointer"
              />
            </div>
          </div>

          {/* PRD Pitch, Tempo & Vocal Frequency Distinctions */}
          <div className="p-4 rounded-2xl bg-[#18080a] border border-[#351316] space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d1013] pb-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#ea3838]" />
                Pitch, Tempo & Vocal Frequency Separation
              </h4>
              <span className="text-[10px] text-[#a67c7f]">PRD Section 2.2 C</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white">Tempo</span>
                  <span className="text-[#ea3838] font-mono">{playbackSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#ea3838] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white">Pitch Shift</span>
                  <span className="text-[#06b6d4] font-mono">{pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  value={pitchSemitones}
                  onChange={(e) => setPitchSemitones(parseInt(e.target.value, 10))}
                  className="w-full accent-[#06b6d4] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white">Vocal EQ Boost</span>
                  <span className="text-amber-400 font-mono">+{vocalClarityEq} dB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={vocalClarityEq}
                  onChange={(e) => setVocalClarityEq(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Lyric Line Timing Editor & Typography Styling */}
        <div className="lg:col-span-7 space-y-4">
          {/* Typography Styling Controls */}
          <div className="p-4 rounded-3xl bg-[#19080a] border border-[#391518] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d1013] pb-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-4 h-4 text-[#ea3838]" />
                Typography & Karaoke Glow Styling
              </h3>
              <span className="text-[11px] text-[#a67c7f]">Live visualizer text styles</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[#a67c7f] font-bold">Font Family</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => {
                    setConfig({ ...config, fontFamily: e.target.value as any });
                    renderCanvasFrame(currentTime);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#230c0e] border border-[#3d1518] text-white"
                >
                  <option value="Space Grotesk">Space Grotesk</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Impact">Impact / Bold</option>
                  <option value="Serif">Cinematic Serif</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#a67c7f] font-bold">Font Size ({config.fontSize}px)</label>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={config.fontSize}
                  onChange={(e) => {
                    setConfig({ ...config, fontSize: parseInt(e.target.value, 10) });
                    renderCanvasFrame(currentTime);
                  }}
                  className="w-full accent-[#ea3838] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#a67c7f] font-bold">Highlight Glow Color</label>
                <input
                  type="color"
                  value={config.highlightColor}
                  onChange={(e) => {
                    setConfig({ ...config, highlightColor: e.target.value });
                    renderCanvasFrame(currentTime);
                  }}
                  className="w-full h-8 rounded-lg bg-transparent cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#a67c7f] font-bold">Vertical Pos ({config.positionY}%)</label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={config.positionY}
                  onChange={(e) => {
                    setConfig({ ...config, positionY: parseInt(e.target.value, 10) });
                    renderCanvasFrame(currentTime);
                  }}
                  className="w-full accent-[#ea3838] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Paste Raw Lyrics Expander */}
          <div className="p-4 rounded-2xl bg-[#1b090b] border border-[#341315] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Paste New Song Lyrics to Auto-Split</span>
              <button
                onClick={handleParseLyrics}
                disabled={!rawPastedLyrics.trim()}
                className="px-3 py-1 rounded-xl bg-[#ea3838] hover:bg-[#ff4747] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Split into Lines
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Paste your lyrics here (each line will become a timed subtitle)..."
              value={rawPastedLyrics}
              onChange={(e) => setRawPastedLyrics(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#140607] border border-[#3b1518] text-xs text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
            />
          </div>

          {/* Synchronized Lines Timeline List */}
          <div className="p-4 rounded-3xl bg-[#18080a] border border-[#391518] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#2d1013] pb-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Lyrics Timeline ({lyrics.length} Lines)</span>
                <span className="px-2 py-0.5 rounded-md bg-[#2a0e12] text-[#ff7b82] text-[10px] font-mono">
                  Active: #{activeLineIndex + 1}
                </span>
              </h3>
              <span className="text-xs text-[#a67c7f]">
                Click any line to scrub playhead. Use "Tap to Sync" to record rhythm.
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {lyrics.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                const isPlayingNow = currentTime >= line.startTime && currentTime <= line.endTime;

                return (
                  <div
                    key={line.id}
                    onClick={() => {
                      setActiveLineIndex(idx);
                      seek(line.startTime);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPlayingNow
                        ? 'border-[#ea3838] bg-[#341115] shadow-lg shadow-[#ea3838]/20 scale-[1.01]'
                        : isActive
                        ? 'border-[#ff7b82]/60 bg-[#250d10]'
                        : 'border-[#331114] bg-[#1a080a] hover:border-[#ea3838]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        isPlayingNow ? 'bg-[#ea3838] text-white' : 'bg-[#290e11] text-[#a67c7f]'
                      }`}>
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLyrics((prev) => {
                            const copy = [...prev];
                            copy[idx].text = val;
                            return copy;
                          });
                        }}
                        className="flex-1 bg-transparent text-xs font-bold text-white focus:outline-none focus:underline"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      <div className="flex items-center gap-1 font-mono text-[#a67c7f]">
                        <input
                          type="number"
                          step="0.1"
                          value={line.startTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setLyrics((prev) => {
                              const copy = [...prev];
                              copy[idx].startTime = val;
                              return copy;
                            });
                          }}
                          className="w-14 px-1.5 py-0.5 rounded-md bg-[#140607] border border-[#3b1518] text-center text-[#ff7b82]"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          step="0.1"
                          value={line.endTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setLyrics((prev) => {
                              const copy = [...prev];
                              copy[idx].endTime = val;
                              return copy;
                            });
                          }}
                          className="w-14 px-1.5 py-0.5 rounded-md bg-[#140607] border border-[#3b1518] text-center text-[#ff7b82]"
                        />
                        <span>s</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLyrics((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1 text-[#8a686b] hover:text-[#ff6b72] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
