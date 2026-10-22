import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Radio, 
  Sparkles, 
  Download, 
  Layers, 
  Music, 
  Type, 
  Play, 
  Pause,
  Image as ImageIcon,
  Sliders,
  Video,
  Upload,
  Palette,
  Volume2,
  Copy,
  Check,
  Film,
  Disc3,
  Eye,
  RefreshCw,
  X,
  Compass,
  AlertCircle,
  Clock
} from 'lucide-react';
import { AudioTrack, TransformationPreset, VideoVisualizerSettings } from '../../types';
import { AudioVisualizerCanvas } from '../AudioVisualizerCanvas';
import { globalAudioEngine } from '../../lib/audioEngine';

interface VisualizerStudioViewProps {
  currentTrack: AudioTrack;
  activePreset: TransformationPreset;
  onSelectTrack?: (track: AudioTrack) => void;
}

export const VisualizerStudioView: React.FC<VisualizerStudioViewProps> = ({
  currentTrack: initialTrack,
  activePreset,
  onSelectTrack,
}) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(initialTrack);
  const [studioMode, setStudioMode] = useState<'video' | 'thumbnail'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialTrack.duration || 180);
  const [activeTab, setActiveTab] = useState<'waves' | 'background' | 'text' | 'export'>('waves');

  // Video & Canvas Settings
  const [settings, setSettings] = useState<VideoVisualizerSettings>({
    aspectRatio: '16:9',
    visualMode: 'circular',
    wavePosition: 'bottom',
    colorTheme: 'leonce_crimson',
    customColor: '#ea3838',
    secondaryColor: '#ff6b72',
    sensitivity: 1.35,
    barCount: 54,
    barWidth: 6,
    glowIntensity: 18,
    waveOpacity: 0.95,
    backgroundImage: null,
    backgroundPreset: 'neon_highway',
    backgroundDim: 0.45,
    backgroundBlur: 0,
    bassPulseBg: true,
    showCoverCenter: true,
    titleText: initialTrack.title,
    artistText: initialTrack.artist || 'LEONCE',
    badgeText: '8D TUNES • 360° AUDIO // LEONCE MASTER',
    showWatermark: true,
    watermarkText: 'LEONCE STUDIOS • 8D AUDIO',
    showLyrics: false,
    lyricsText: 'Driving through the midnight rain in 8D motion...',
    textPosition: 'bottom_left',
  });

  // HD Video Recording State
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFastRendering, setIsFastRendering] = useState(false);
  const [fastRenderCountdown, setFastRenderCountdown] = useState(10);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [targetDuration, setTargetDuration] = useState<number>(30); // 15, 30, 60, or full
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [copiedThumbnail, setCopiedThumbnail] = useState(false);
  const [isExportingThumbnail, setIsExportingThumbnail] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Memoized canvas ready callback to prevent infinite re-renders
  const handleCanvasReady = useCallback((c: HTMLCanvasElement | null) => {
    setCanvasElement((prev) => (prev === c ? prev : c));
  }, []);

  // Sync track changes
  useEffect(() => {
    setCurrentTrack(initialTrack);
    setSettings((prev) => ({
      ...prev,
      titleText: initialTrack.title,
      artistText: initialTrack.artist || 'LEONCE',
    }));
  }, [initialTrack]);

  // Audio Engine subscription
  useEffect(() => {
    const unsub = globalAudioEngine.subscribe(({ isPlaying, currentTime, duration }) => {
      setIsPlaying(isPlaying);
      setCurrentTime(currentTime);
      if (duration > 0) setDuration(duration);
    });
    return () => unsub();
  }, []);

  // Kinetic lyrics ticker
  useEffect(() => {
    if (!isPlaying || !settings.showLyrics) return;
    const lyricsList = [
      'Driving through the midnight rain in 8D motion...',
      'Your frequency resonates across the dark horizon...',
      'Dilating time with cathedral spatial reverb...',
      'LEONCE sound waves pulsing at 44.1kHz...',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % lyricsList.length;
      setSettings((prev) => ({ ...prev, lyricsText: lyricsList[idx] }));
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, settings.showLyrics]);

  // Color Theme definitions
  const COLOR_PALETTES = [
    { id: 'leonce_crimson', name: 'LEONCE Crimson', primary: '#ea3838', secondary: '#ff6b72' },
    { id: 'cyber_cyan', name: 'Cyber Cyan', primary: '#00f0ff', secondary: '#0077ff' },
    { id: 'sunset_amber', name: 'Sunset Amber', primary: '#f59e0b', secondary: '#ef4444' },
    { id: 'frost_white', name: 'Arctic Frost', primary: '#ffffff', secondary: '#93c5fd' },
    { id: 'toxic_emerald', name: 'Toxic Emerald', primary: '#10b981', secondary: '#059669' },
    { id: 'electric_violet', name: 'Electric Violet', primary: '#d946ef', secondary: '#8b5cf6' },
  ];

  // Preset Backgrounds Gallery
  const BACKGROUND_PRESETS = [
    {
      id: 'neon_highway',
      name: 'LEONCE Neon Highway (3AM Rain)',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'spatial_nebula',
      name: '8D Cosmic Deep Space',
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'rainy_windshield',
      name: 'Rain On Windshield Lights',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'retro_cassette',
      name: 'Vintage Tape & Synth Deck',
      url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'minimal_obsidian',
      name: 'Obsidian Soundstage Studio',
      url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1920&q=80',
    },
    {
      id: 'album_cover',
      name: 'Current Track Album Art',
      url: currentTrack.coverUrl?.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    },
  ];

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSettings((prev) => ({
        ...prev,
        backgroundImage: dataUrl,
        backgroundPreset: 'custom',
      }));
    };
    reader.readAsDataURL(file);
  };

  // Trigger file download programmatically without iframe navigation blocking
  const triggerFileDownload = (blobOrUrl?: Blob | string, customFilename?: string) => {
    try {
      const sourceBlob = blobOrUrl instanceof Blob ? blobOrUrl : recordedBlob;
      let url = typeof blobOrUrl === 'string' ? blobOrUrl : recordedVideoUrl;
      let tempCreated = false;

      if (!url && sourceBlob) {
        url = URL.createObjectURL(sourceBlob);
        tempCreated = true;
      }

      if (!url) {
        setToastMessage({ type: 'error', text: 'No video is ready yet. Please record a video first.' });
        return;
      }

      const defaultFilename = `${settings.artistText}_${settings.titleText}_HD_Visualizer.webm`.replace(/[^\w.-]+/g, '_');
      const filename = customFilename || defaultFilename;

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        if (tempCreated) URL.revokeObjectURL(url!);
      }, 1000);

      setToastMessage({ type: 'success', text: `Downloaded ${filename} successfully!` });
    } catch (err) {
      console.error('Video download trigger error:', err);
      setToastMessage({ type: 'error', text: 'Download error: ' + (err instanceof Error ? err.message : String(err)) });
    }
  };

  // Start HD Video Recording (handles both live recording and auto-rendered exports)
  const startRecordingHDVideo = async (overrideDuration?: number, autoDownload: boolean = false) => {
    if (!canvasElement) {
      setToastMessage({ type: 'error', text: 'Visualizer canvas is initializing. Please wait a moment.' });
      return;
    }

    try {
      // 1. Ensure audio engine context is active and playing
      if (!isPlaying) {
        try {
          await globalAudioEngine.play();
        } catch (e) {
          console.warn('Audio auto-play note:', e);
        }
      }

      // 2. Capture HD Canvas Stream (30 FPS for smooth, efficient encoding)
      const canvasStream = canvasElement.captureStream(30);

      // 3. Capture audio stream safely from Web Audio engine
      let audioStream: MediaStream | null = null;
      try {
        audioStream = globalAudioEngine.getAudioMediaStream();
      } catch (err) {
        console.warn('Audio stream capture note:', err);
      }

      // 4. Combine Video + Audio tracks into single stream
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        tracks.push(audioStream.getAudioTracks()[0]);
      }

      const combinedStream = new MediaStream(tracks);

      // 5. Select best supported codec
      const supportedMimes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = '';
      for (const m of supportedMimes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: 2500000, // 2.5 Mbps crisp HD without high memory footprint
      };
      if (selectedMime) {
        recorderOptions.mimeType = selectedMime;
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(combinedStream, recorderOptions);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      const finalDuration = overrideDuration !== undefined ? overrideDuration : targetDuration;

      recorder.onstop = () => {
        try {
          const finalBlob = new Blob(recordedChunksRef.current, { type: selectedMime || 'video/webm' });
          setRecordedBlob(finalBlob);
          const videoUrl = URL.createObjectURL(finalBlob);
          setRecordedVideoUrl(videoUrl);
          setShowVideoModal(true);
          setIsRecording(false);
          setIsFastRendering(false);

          if (autoDownload) {
            triggerFileDownload(finalBlob);
          } else {
            setToastMessage({ type: 'success', text: 'HD Video recorded! Ready for download.' });
          }
        } catch (e) {
          setToastMessage({ type: 'error', text: 'Failed to package video: ' + String(e) });
          setIsRecording(false);
          setIsFastRendering(false);
        }
        if (recordIntervalRef.current) {
          clearInterval(recordIntervalRef.current);
          recordIntervalRef.current = null;
        }
      };

      recorder.start(500); // Collect chunks every 500ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      // Timer & auto-stop
      let elapsed = 0;
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = window.setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (overrideDuration !== undefined) {
          setFastRenderCountdown(Math.max(0, overrideDuration - elapsed));
        }
        if (finalDuration > 0 && elapsed >= finalDuration) {
          stopRecordingHDVideo();
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start HD video recorder:', err);
      setIsRecording(false);
      setIsFastRendering(false);
      setToastMessage({
        type: 'error',
        text: 'Video capture error: ' + (err instanceof Error ? err.message : String(err)),
      });
    }
  };

  // Stop HD Video Recording
  const stopRecordingHDVideo = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch { /* ignore */ }
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  };

  // 1-Click Fast Render & Download (10s HD Clip)
  const handleFastRenderAndDownload = async () => {
    setIsFastRendering(true);
    setFastRenderCountdown(10);
    setToastMessage({ type: 'info', text: 'Rendering 10s HD visualizer clip with audio frequencies...' });
    await startRecordingHDVideo(10, true);
  };

  // 1-Click HD Thumbnail Download
  const handleDownloadThumbnail = () => {
    if (!canvasElement) {
      setToastMessage({ type: 'error', text: 'Visualizer canvas is not ready.' });
      return;
    }
    setIsExportingThumbnail(true);
    try {
      const filename = `${settings.artistText}_${settings.titleText}_HD_Thumbnail.png`.replace(/[^\w.-]+/g, '_');
      canvasElement.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsExportingThumbnail(false);
          }, 600);
          setToastMessage({ type: 'success', text: `Downloaded ${filename}!` });
        } else {
          const dataUrl = canvasElement.toDataURL('image/png', 0.95);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
            setIsExportingThumbnail(false);
          }, 600);
          setToastMessage({ type: 'success', text: `Downloaded ${filename}!` });
        }
      }, 'image/png');
    } catch (err) {
      console.error('Thumbnail export error:', err);
      setToastMessage({ type: 'error', text: 'Thumbnail error: ' + (err instanceof Error ? err.message : String(err)) });
      setIsExportingThumbnail(false);
    }
  };

  // Copy Thumbnail to Clipboard
  const handleCopyThumbnail = async () => {
    if (!canvasElement) return;
    try {
      canvasElement.toBlob(async (blob) => {
        if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopiedThumbnail(true);
          setToastMessage({ type: 'success', text: 'Thumbnail copied to clipboard!' });
          setTimeout(() => setCopiedThumbnail(false), 2000);
        } else {
          handleDownloadThumbnail();
        }
      });
    } catch {
      handleDownloadThumbnail();
    }
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-7 overflow-y-auto space-y-6 select-none bg-[#120607] text-[#f4e8e8]">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radio className="w-5 h-5 text-[#ea3838] animate-pulse" />
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              HD VIDEO & THUMBNAIL STUDIO
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838]/20 border border-[#ea3838]/40 text-[#ff6b72] text-[10px] font-black uppercase">
              LEONCE 1080p Engine
            </span>
          </div>
          <p className="text-xs text-[#a67c7f]">
            Overlay audio frequency waveforms onto custom images, customize thumbnails, and export 1080p HD videos in real time.
          </p>
        </div>

        {/* Quick Mode & Track Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex p-1 rounded-2xl bg-[#150608] border border-[#3b1517]">
            <button
              onClick={() => setStudioMode('video')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                studioMode === 'video'
                  ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/30'
                  : 'text-[#a67c7f] hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              HD Video Makeup
            </button>
            <button
              onClick={() => setStudioMode('thumbnail')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                studioMode === 'thumbnail'
                  ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/30'
                  : 'text-[#a67c7f] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Thumbnail Creator
            </button>
          </div>

          {/* Current Imported Track Info */}
          <div className="flex items-center gap-2 bg-[#220c0e] px-3 py-1.5 rounded-2xl border border-[#3c1518]">
            <Music className="w-3.5 h-3.5 text-[#ff6b72]" />
            <span className="text-xs font-bold text-white max-w-[200px] truncate">
              {currentTrack.id !== 'unloaded' ? currentTrack.title : 'No Song Imported'}
            </span>
            <label className="ml-1 px-2.5 py-1 rounded-xl bg-[#2e0f12] hover:bg-[#3d1417] text-[#ff6b72] hover:text-white border border-[#441619] text-[11px] font-bold cursor-pointer transition-all">
              <span>{currentTrack.id !== 'unloaded' ? 'Change Song' : 'Import Audio'}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const buf = await globalAudioEngine.loadAudioFile(file);
                    const newT: AudioTrack = {
                      id: `upload-${Date.now()}`,
                      title: file.name.replace(/\.[^/.]+$/, ''),
                      artist: 'My Imported Music',
                      duration: Math.round(buf.duration),
                      bpm: 120,
                      key: 'Detected',
                      energy: 'High',
                      vocals: 'Detected',
                      lufs: -10,
                      genre: 'User Track',
                      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
                      sourceType: 'user_upload',
                    };
                    setCurrentTrack(newT);
                    if (onSelectTrack) onSelectTrack(newT);
                    setSettings((prev) => ({
                      ...prev,
                      titleText: newT.title,
                      artistText: newT.artist,
                    }));
                    globalAudioEngine.play();
                  } catch (err) {
                    console.error('Audio load error', err);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* MAIN WORKBENCH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT STAGE: HD CANVAS & TRANSPORT CONTROLS (Cols 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-2xl relative flex flex-col items-center">
            {/* Aspect Ratio Top Bar */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-[#301214] mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">CANVAS FORMAT:</span>
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setSettings((prev) => ({ ...prev, aspectRatio: ratio }))}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                      settings.aspectRatio === ratio
                        ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/40'
                        : 'bg-[#220d0f] border border-[#3a1517] text-[#a67c7f] hover:text-white'
                    }`}
                  >
                    {ratio} {ratio === '16:9' ? 'YouTube' : ratio === '9:16' ? 'TikTok' : 'Square'}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-bold text-[#ff6b72] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ea3838] animate-ping" />
                1080p HD Engine
              </div>
            </div>

            {/* The Interactive Visualizer Canvas */}
            <div className="w-full flex justify-center items-center relative">
              <AudioVisualizerCanvas
                trackTitle={currentTrack.title}
                artist={currentTrack.artist}
                preset={activePreset}
                aspectRatio={settings.aspectRatio}
                visualMode={settings.visualMode}
                coverUrl={settings.backgroundImage || currentTrack.coverUrl}
                settings={settings}
                onCanvasReady={handleCanvasReady}
                className="w-full"
              />

              {/* Live Recording HUD Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-[#ea3838] shadow-2xl animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-[#ea3838] animate-ping" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">
                    {isFastRendering
                      ? `RENDERING 10s HD CLIP // ${fastRenderCountdown}s REMAINING...`
                      : `RECORDING HD VIDEO // ${formatTime(recordingSeconds)} / ${targetDuration > 0 ? formatTime(targetDuration) : '∞'}`}
                  </span>
                </div>
              )}
            </div>

            {/* LIVE AUDIO TRANSPORT BAR */}
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-[#140608] border border-[#341315] flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      globalAudioEngine.pause();
                    } else {
                      globalAudioEngine.play();
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-[#ea3838] hover:bg-[#ff3b47] text-white flex items-center justify-center transition-all shadow-lg shadow-[#ea3838]/30 active:scale-95"
                  title={isPlaying ? 'Pause Audio' : 'Play Live Audio'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div>
                  <div className="text-xs font-black text-white truncate max-w-[220px]">
                    {currentTrack.title}
                  </div>
                  <div className="text-[10px] text-[#a67c7f]">
                    {formatTime(currentTime)} / {formatTime(duration)} • {isPlaying ? 'Playing Real-Time Waves' : 'Paused'}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadThumbnail}
                  disabled={isExportingThumbnail}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#260e10] hover:bg-[#381417] text-[#ff8085] hover:text-white border border-[#4a1c20] text-xs font-bold transition-all shadow-md active:scale-95"
                  title="Download HD PNG Thumbnail"
                >
                  <Download className="w-3.5 h-3.5" />
                  HD Thumbnail
                </button>

                <button
                  onClick={handleCopyThumbnail}
                  className="p-2 rounded-xl bg-[#220d0f] hover:bg-[#341315] text-[#b58e91] hover:text-white border border-[#3c1518] transition-all"
                  title="Copy Snapshot to Clipboard"
                >
                  {copiedThumbnail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* DIRECT HD VIDEO MAKEUP / RECORDING CONTROL DOCK */}
            <div className="w-full mt-3 p-4 rounded-2xl bg-gradient-to-r from-[#240c0f] via-[#2a0e12] to-[#1c080a] border border-[#ea3838]/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <Film className="w-4 h-4 text-[#ea3838]" />
                  <span>DIRECT HD VIDEO GENERATOR</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ea3838]/30 text-[#ff8085] font-bold">
                    WebM Broadcast Stereo Audio
                  </span>
                </div>
                <div className="text-[11px] text-[#b0878a] mt-0.5">
                  Synchronizes live 44.1kHz audio waveforms with high-definition canvas rendering.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1-Click Fast Render & Download button */}
                <button
                  onClick={handleFastRenderAndDownload}
                  disabled={isRecording}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2c0e12] hover:bg-[#3e1318] text-[#ff7b82] hover:text-white border border-[#521c21] text-xs font-bold transition-all shadow-md active:scale-95"
                  title="Render 10-second HD video and download immediately"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ff6b72]" />
                  <span>1-Click 10s HD Clip</span>
                </button>

                {/* Duration selector */}
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(Number(e.target.value))}
                  disabled={isRecording}
                  className="px-3 py-2 rounded-xl bg-[#170608] border border-[#48191d] text-xs font-bold text-white focus:outline-none"
                >
                  <option value={15}>15s (Shorts/Reel)</option>
                  <option value={30}>30s (TikTok/Teaser)</option>
                  <option value={60}>60s (Full Preview)</option>
                  <option value={Math.floor(duration)}>Full Track ({formatTime(duration)})</option>
                  <option value={0}>Manual Stop</option>
                </select>

                {isRecording ? (
                  <button
                    onClick={stopRecordingHDVideo}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea3838] hover:bg-[#ff2f3c] text-white text-xs font-black shadow-lg shadow-[#ea3838]/50 animate-pulse transition-all active:scale-95"
                  >
                    <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                    Stop & Save HD Video
                  </button>
                ) : (
                  <button
                    onClick={() => startRecordingHDVideo()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea3838] hover:bg-[#ff3b47] text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95"
                  >
                    <Video className="w-4 h-4 fill-current" />
                    Record HD Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT STAGE: CUSTOMIZATION WORKBENCH (Cols 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Subtabs for customizer */}
          <div className="p-1 rounded-2xl bg-[#1b090b] border border-[#371518] grid grid-cols-4 gap-1">
            {[
              { id: 'waves', label: 'Waveforms', icon: Sliders },
              { id: 'background', label: 'Image/Art', icon: ImageIcon },
              { id: 'text', label: 'Overlays', icon: Type },
              { id: 'export', label: 'Export HD', icon: Download },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'waves' | 'background' | 'text' | 'export')}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/30'
                      : 'text-[#a67c7f] hover:text-white hover:bg-[#250d0f]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mb-1" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: WAVEFORMS & AUDIO WAVES MAKEUP */}
          {activeTab === 'waves' && (
            <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] space-y-4 shadow-xl">
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  1. WAVEFORM SPECTRUM STYLE
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'circular', label: 'Circular 360° Radial', desc: 'Central album cover' },
                    { id: 'bars', label: 'Frequency Bars', desc: 'Classic EQ spectrum' },
                    { id: 'mirror_bars', label: 'Mirror Horizon Bars', desc: 'Dual reflection' },
                    { id: 'oscilloscope', label: 'Neon Sine Wave', desc: 'Fluid oscilloscope' },
                    { id: 'particles', label: 'Audio Particles', desc: 'Cosmic particle cloud' },
                    { id: 'orbit8d', label: '8D Orbital Waves', desc: 'Spatial LFO panning' },
                    { id: 'pulse_ring', label: 'Bass Shockwave', desc: 'Expanding ripples' },
                    { id: 'cassette_vu', label: 'Retro VU Meter', desc: 'Analog tape deck' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSettings((prev) => ({ ...prev, visualMode: mode.id as VideoVisualizerSettings['visualMode'] }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.visualMode === mode.id
                          ? 'bg-[#2f1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                          : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{mode.label}</div>
                      <div className="text-[9px] text-[#8c676a] mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wave Placement on Image */}
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  2. WAVEFORM PLACEMENT ON IMAGE
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bottom', label: 'Bottom Overlay' },
                    { id: 'lower_third', label: 'Lower Third' },
                    { id: 'center', label: 'Dead Center' },
                    { id: 'horizon', label: 'Horizon Line' },
                    { id: 'ambient', label: 'Ambient Full' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setSettings((prev) => ({ ...prev, wavePosition: pos.id as VideoVisualizerSettings['wavePosition'] }))}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        settings.wavePosition === pos.id
                          ? 'bg-[#ea3838] border-[#ea3838] text-white shadow-sm shadow-[#ea3838]/30'
                          : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wave Color Themes */}
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  3. WAVEFORM COLOR & GLOW PALETTE
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => setSettings((prev) => ({
                        ...prev,
                        colorTheme: pal.id,
                        customColor: pal.primary,
                        secondaryColor: pal.secondary,
                      }))}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                        settings.colorTheme === pal.id
                          ? 'bg-[#2b0f12] border-[#ea3838] text-white shadow-md'
                          : 'bg-[#1e0a0d] border-[#371518] text-[#a67c7f] hover:text-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: pal.primary }} />
                      <span className="text-[11px] font-bold truncate">{pal.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fine-Tuning Sliders */}
              <div className="space-y-3 pt-2 border-t border-[#371518]">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#c89fa2]">Wave Amplitude & Sensitivity</span>
                    <span className="text-white font-mono">{settings.sensitivity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={settings.sensitivity}
                    onChange={(e) => setSettings((prev) => ({ ...prev, sensitivity: Number(e.target.value) }))}
                    className="w-full accent-[#ea3838]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#c89fa2]">Bar Count / Frequency Detail</span>
                    <span className="text-white font-mono">{settings.barCount} bars</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    step="2"
                    value={settings.barCount}
                    onChange={(e) => setSettings((prev) => ({ ...prev, barCount: Number(e.target.value) }))}
                    className="w-full accent-[#ea3838]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#c89fa2]">Neon Glow Bloom</span>
                    <span className="text-white font-mono">{settings.glowIntensity}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="1"
                    value={settings.glowIntensity}
                    onChange={(e) => setSettings((prev) => ({ ...prev, glowIntensity: Number(e.target.value) }))}
                    className="w-full accent-[#ea3838]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKGROUND & IMAGE OVERLAYS */}
          {activeTab === 'background' && (
            <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] space-y-4 shadow-xl">
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  1. UPLOAD CUSTOM IMAGE OR CHOOSE PRESET
                </span>

                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-3 p-3 rounded-2xl bg-[#260e11] hover:bg-[#381417] border-2 border-dashed border-[#ea3838]/60 text-white flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Upload className="w-4 h-4 text-[#ea3838]" />
                  Upload Custom Artwork / Photo
                </button>

                {/* Preset Gallery */}
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_PRESETS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSettings((prev) => ({
                        ...prev,
                        backgroundPreset: bg.id,
                        backgroundImage: bg.url,
                      }))}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        settings.backgroundPreset === bg.id
                          ? 'bg-[#2b0e11] border-[#ea3838] text-white shadow-md'
                          : 'bg-[#1f0a0d] border-[#371518] text-[#a67c7f] hover:text-white'
                      }`}
                    >
                      {bg.url && bg.url.trim() !== '' ? (
                        <img src={bg.url} alt={bg.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#2a0d10]" />
                      )}
                      <div className="text-[11px] font-bold truncate leading-tight">{bg.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Filters */}
              <div className="space-y-3 pt-3 border-t border-[#371518]">
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-1">
                  2. BACKGROUND FILTERS & DEPTH
                </span>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#c89fa2]">Dark Vignette / Dim Overlay</span>
                    <span className="text-white font-mono">{Math.round(settings.backgroundDim * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.05"
                    value={settings.backgroundDim}
                    onChange={(e) => setSettings((prev) => ({ ...prev, backgroundDim: Number(e.target.value) }))}
                    className="w-full accent-[#ea3838]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#c89fa2]">Background Blur</span>
                    <span className="text-white font-mono">{settings.backgroundBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={settings.backgroundBlur}
                    onChange={(e) => setSettings((prev) => ({ ...prev, backgroundBlur: Number(e.target.value) }))}
                    className="w-full accent-[#ea3838]"
                  />
                </div>

                {/* Bass Pulse Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#200b0e] border border-[#391518]">
                  <div>
                    <div className="text-xs font-bold text-white">Audio Bass Pulse on Image</div>
                    <div className="text-[10px] text-[#a67c7f]">Subtle dynamic zoom reaction to kick drum</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bassPulseBg}
                    onChange={(e) => setSettings((prev) => ({ ...prev, bassPulseBg: e.target.checked }))}
                    className="w-4 h-4 accent-[#ea3838] rounded cursor-pointer"
                  />
                </div>

                {/* Central Cover Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#200b0e] border border-[#391518]">
                  <div>
                    <div className="text-xs font-bold text-white">Central Circular Art Ring</div>
                    <div className="text-[10px] text-[#a67c7f]">Embed circular album art inside radial waves</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showCoverCenter}
                    onChange={(e) => setSettings((prev) => ({ ...prev, showCoverCenter: e.target.checked }))}
                    className="w-4 h-4 accent-[#ea3838] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEXT & OVERLAYS */}
          {activeTab === 'text' && (
            <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] space-y-4 shadow-xl">
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  CUSTOM SONG & ARTIST TITLES
                </span>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#b58e91] block mb-1">Song Title</label>
                    <input
                      type="text"
                      value={settings.titleText}
                      onChange={(e) => setSettings((prev) => ({ ...prev, titleText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs font-bold text-white focus:outline-none focus:border-[#ea3838]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#b58e91] block mb-1">Artist / Producer</label>
                    <input
                      type="text"
                      value={settings.artistText}
                      onChange={(e) => setSettings((prev) => ({ ...prev, artistText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs font-bold text-white focus:outline-none focus:border-[#ea3838]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#b58e91] block mb-1">Style Treatment Badge</label>
                    <input
                      type="text"
                      value={settings.badgeText}
                      onChange={(e) => setSettings((prev) => ({ ...prev, badgeText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs font-bold text-white focus:outline-none focus:border-[#ea3838]"
                    />
                  </div>
                </div>
              </div>

              {/* Text Positioning */}
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  TEXT POSITIONING
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bottom_left', label: 'Bottom Left' },
                    { id: 'center', label: 'Center Stage' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => setSettings((prev) => ({ ...prev, textPosition: pos.id as 'bottom_left' | 'center' }))}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        settings.textPosition === pos.id
                          ? 'bg-[#ea3838] border-[#ea3838] text-white shadow-md'
                          : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Synced Lyrics Toggle */}
              <div className="p-3 rounded-2xl bg-[#200b0e] border border-[#391518] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Kinetic Synced Lyrics</div>
                    <div className="text-[10px] text-[#a67c7f]">Overlay floating lyric quotes synced to beat</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showLyrics}
                    onChange={(e) => setSettings((prev) => ({ ...prev, showLyrics: e.target.checked }))}
                    className="w-4 h-4 accent-[#ea3838] rounded cursor-pointer"
                  />
                </div>
                {settings.showLyrics && (
                  <input
                    type="text"
                    value={settings.lyricsText}
                    onChange={(e) => setSettings((prev) => ({ ...prev, lyricsText: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#170608] border border-[#3d1618] text-xs text-white"
                    placeholder="Custom lyric phrase..."
                  />
                )}
              </div>

              {/* Watermark Branding */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#200b0e] border border-[#391518]">
                <div>
                  <div className="text-xs font-bold text-white">Watermark Logo Badge</div>
                  <div className="text-[10px] text-[#a67c7f]">Display official LEONCE / 8D Audio mark</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWatermark}
                  onChange={(e) => setSettings((prev) => ({ ...prev, showWatermark: e.target.checked }))}
                  className="w-4 h-4 accent-[#ea3838] rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT HD SETTINGS */}
          {activeTab === 'export' && (
            <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] space-y-4 shadow-xl">
              <div>
                <span className="text-xs font-black text-white block uppercase tracking-wider mb-2">
                  HD EXPORT SPECIFICATIONS
                </span>
                <div className="space-y-2.5 p-4 rounded-2xl bg-[#170608] border border-[#331214] text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#a67c7f]">Video Resolution:</span>
                    <span className="font-bold text-white">
                      {settings.aspectRatio === '16:9' ? '1920 × 1080 (Full HD)' : settings.aspectRatio === '9:16' ? '1080 × 1920 (Full HD)' : '1080 × 1080 (HD Square)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a67c7f]">Frame Rate:</span>
                    <span className="font-bold text-white">30 / 60 FPS Smooth Canvas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a67c7f]">Audio Stream:</span>
                    <span className="font-bold text-white">44.1kHz Hi-Res Stereo with 8D Binaural</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a67c7f]">Video Encoding:</span>
                    <span className="font-bold text-[#ff6b72]">WebM (VP9 / VP8) Broadcast Quality</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {/* 1-Click Fast Render & Download */}
                <button
                  onClick={handleFastRenderAndDownload}
                  disabled={isRecording}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4757] hover:from-[#d62f2f] hover:to-[#ea3838] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-[#ea3838]/40 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  {isFastRendering ? `Rendering 10s Clip (${fastRenderCountdown}s remaining)...` : '1-Click Fast Render & Download (10s HD Clip)'}
                </button>

                {/* Live Full Recording */}
                <button
                  onClick={() => startRecordingHDVideo()}
                  disabled={isRecording}
                  className="w-full py-3 px-4 rounded-2xl bg-[#240c0f] hover:bg-[#341216] border border-[#521c21] text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <Video className="w-4 h-4 text-[#ff6b72]" />
                  {isRecording && !isFastRendering ? `Recording (${recordingSeconds}s)...` : 'Live Record Custom Length HD Video'}
                </button>

                {/* If previously recorded video is ready, quick re-download */}
                {(recordedVideoUrl || recordedBlob) && (
                  <button
                    onClick={() => triggerFileDownload()}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#142818] hover:bg-[#1a3821] border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Download Last Exported Video (.webm)
                  </button>
                )}

                <button
                  onClick={handleDownloadThumbnail}
                  disabled={isExportingThumbnail}
                  className="w-full py-3 px-4 rounded-2xl bg-[#260e10] hover:bg-[#381417] text-white border border-[#4a1c20] text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#ff6b72]" />
                  Download HD Thumbnail / Cover (.PNG)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXPORTED VIDEO PREVIEW MODAL */}
      {showVideoModal && recordedVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-[#1b090b] border border-[#ea3838]/50 shadow-[0_0_80px_rgba(234,56,56,0.3)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#ea3838]" />
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  HD VIDEO READY FOR DOWNLOAD
                </h3>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1.5 rounded-xl bg-[#260e10] hover:bg-[#381417] text-[#a67c7f] hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="overflow-hidden rounded-2xl bg-black border border-[#3b1517] shadow-xl">
              {recordedVideoUrl && recordedVideoUrl.trim() !== '' ? (
                <video
                  src={recordedVideoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[360px] object-contain"
                />
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#a67c7f]">
                Format: <span className="text-white font-bold">HD WebM</span> • 44.1kHz Hi-Res Stereo Audio
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => triggerFileDownload()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ea3838] hover:bg-[#ff3b47] text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download HD Video (.webm)
                </button>

                <button
                  onClick={handleDownloadThumbnail}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#280e11] hover:bg-[#3a1518] text-white border border-[#4d1a1d] text-xs font-bold transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#ff6b72]" />
                  Download Thumbnail (.png)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING STATUS TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-fade-in ${
          toastMessage.type === 'error'
            ? 'bg-[#2d090b]/95 border-[#ea3838] text-white shadow-[#ea3838]/30'
            : toastMessage.type === 'success'
            ? 'bg-[#0b2816]/95 border-emerald-500 text-white shadow-emerald-500/20'
            : 'bg-[#180a0c]/95 border-[#ff6b72]/60 text-white shadow-black/60'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${
            toastMessage.type === 'error' ? 'bg-[#ea3838]' : toastMessage.type === 'success' ? 'bg-emerald-400' : 'bg-[#ff6b72] animate-ping'
          }`} />
          <span className="text-xs font-bold tracking-wide">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/60 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
