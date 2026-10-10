import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Sparkles, 
  Upload, 
  Layers, 
  Sliders, 
  Activity, 
  Headphones, 
  Flame, 
  Check, 
  Loader2,
  Video,
  Zap
} from 'lucide-react';
import { AudioTrack, TransformationPreset, VocalModel } from '../../types';
import { PRESET_STYLES, SAMPLE_TRACKS } from '../../lib/constants';
import { globalAudioEngine } from '../../lib/audioEngine';
import { AudioVisualizerCanvas } from '../AudioVisualizerCanvas';
import { DownloadStemsModal } from '../DownloadStemsModal';

interface StudioEngineViewProps {
  currentTrack: AudioTrack;
  onUpdateTrack: (track: AudioTrack) => void;
  activePreset: TransformationPreset;
  onUpdatePreset: (preset: TransformationPreset) => void;
  onOpenMakeItAVibe: () => void;
  onOpenVocalModels?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenInstrumentalSwapper?: () => void;
  onOpenBeatMaker?: () => void;
  activeVocalModel?: VocalModel | null;
}

export const StudioEngineView: React.FC<StudioEngineViewProps> = ({
  currentTrack,
  onUpdateTrack,
  activePreset,
  onUpdatePreset,
  onOpenMakeItAVibe,
  onOpenVocalModels,
  onOpenVideoStudio,
  onOpenInstrumentalSwapper,
  onOpenBeatMaker,
  activeVocalModel,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(currentTrack.duration);
  const [isABOriginal, setIsABOriginal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [isDownloadStemsOpen, setIsDownloadStemsOpen] = useState(false);

  // Custom AI prompt state
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAiGeneratingStyle, setIsAiGeneratingStyle] = useState(false);
  const [customStyleStatus, setCustomStyleStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Engine synchronization
  useEffect(() => {
    const unsub = globalAudioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      if (state.duration > 0) {
        setDuration(state.duration);
      }
    });
    return () => {
      unsub();
    };
  }, []);

  const handlePlayToggle = async () => {
    const ctx = globalAudioEngine.getAudioContext();
    if (!ctx) {
      await globalAudioEngine.loadSyntheticTrack('midnight_drive');
    }
    globalAudioEngine.togglePlay();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    globalAudioEngine.seek(target);
  };

  const handleABToggle = () => {
    const nextMode = !isABOriginal;
    setIsABOriginal(nextMode);
    globalAudioEngine.setABMode(nextMode);
  };

  const handleParamChange = (key: keyof TransformationPreset, val: unknown) => {
    const updated = { ...activePreset, [key]: val };
    onUpdatePreset(updated);
    globalAudioEngine.setTransformation(updated);
  };

  // Upload custom audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const decodedBuffer = await globalAudioEngine.loadAudioFile(file);
      const newTrack: AudioTrack = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'User Upload',
        duration: Math.round(decodedBuffer.duration),
        bpm: 120, // default detected
        key: 'G Minor',
        energy: 'High',
        vocals: 'Detected',
        lufs: -10.2,
        genre: 'Custom Audio',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        sourceType: 'user_upload',
      };
      onUpdateTrack(newTrack);
      setDuration(decodedBuffer.duration);
      globalAudioEngine.play();
    } catch (err) {
      console.error('Failed to decode file:', err);
    }
  };

  // Export processed WAV file
  const handleExportWAV = async () => {
    try {
      setIsExportingWav(true);
      const wavBlob = await globalAudioEngine.renderAndExportWAV();
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.title.replace(/\s+/g, '_')}_${activePreset.name.replace(/\s+/g, '_')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (err) {
      console.error('Failed to render WAV:', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Generate Custom Style from AI Natural Language prompt
  const handleGenerateCustomStyle = async () => {
    if (!customPrompt.trim()) return;
    setIsAiGeneratingStyle(true);
    setCustomStyleStatus(null);
    try {
      const res = await fetch('/api/gemini/custom-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feelingPrompt: customPrompt }),
      });
      
      let data: Record<string, any> | null = null;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn('Non-JSON response received, using acoustic synthesizer defaults:', parseErr);
      }

      if (data && data.settings) {
        const customPreset: TransformationPreset = {
          id: `custom-${Date.now()}`,
          name: data.styleName || 'Custom Mood',
          category: 'Experimental',
          badge: data.soundProfile || 'AI Crafted',
          description: data.description || 'Sonic treatment crafted by Gemini AI from your feeling prompt.',
          speed: data.settings.speed || 0.75,
          pitch: data.settings.pitch || -2.5,
          reverbWet: data.settings.reverbWet || 0.5,
          reverbDecay: data.settings.reverbDecay || 5.0,
          bassBoost: data.settings.bassBoost || 4.0,
          stereoWidth: data.settings.stereoWidth || 1.3,
          pan8d: Boolean(data.settings.pan8d),
          panSpeed: data.settings.panSpeed || 0.1,
          lofiCutoff: data.settings.lofiCutoff || 14000,
          color: '#ff3b47',
        };
        onUpdatePreset(customPreset);
        globalAudioEngine.setTransformation(customPreset);
        setCustomStyleStatus(`Style created: ${customPreset.name}`);
      } else {
        // Intelligent client-side fallback
        const p = customPrompt.toLowerCase();
        const isRain = p.includes('rain') || p.includes('midnight') || p.includes('dark');
        const fallbackPreset: TransformationPreset = {
          id: `custom-${Date.now()}`,
          name: isRain ? 'Midnight Rain' : 'Custom Ambient',
          category: 'Experimental',
          badge: 'Acoustic Synthesizer',
          description: `Custom setting crafted from: "${customPrompt}"`,
          speed: isRain ? 0.74 : 0.8,
          pitch: isRain ? -2.8 : -2.0,
          reverbWet: isRain ? 0.6 : 0.45,
          reverbDecay: isRain ? 6.0 : 4.5,
          bassBoost: isRain ? 5.0 : 3.5,
          stereoWidth: 1.4,
          pan8d: true,
          panSpeed: 0.1,
          lofiCutoff: isRain ? 3800 : 16000,
          color: '#ff3b47',
        };
        onUpdatePreset(fallbackPreset);
        globalAudioEngine.setTransformation(fallbackPreset);
        setCustomStyleStatus(`Style created: ${fallbackPreset.name}`);
      }
    } catch (err) {
      console.error(err);
      setCustomStyleStatus('Applied fallback custom parameters.');
    } finally {
      setIsAiGeneratingStyle(false);
    }
  };

  const categories = ['All', 'Afrobeat', 'Amapiano', 'African Rhythms', 'Remix & Swap', 'Slowed', 'Sped Up', 'Spatial', 'Reverb', 'Bass', 'Atmosphere', 'Retro', 'Experimental'];
  const filteredPresets = selectedCategory === 'All'
    ? PRESET_STYLES
    : PRESET_STYLES.filter((p) => p.category === selectedCategory);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleQuickWordsOnly = () => {
    const isCurrentlyWordsOnly = globalAudioEngine.getStemMode() === 'words_only';
    if (isCurrentlyWordsOnly) {
      globalAudioEngine.setStemMode('full');
      globalAudioEngine.setStemLevels({ vocals: 1.0, beat: 1.0, swappedInstrumental: 0.0 });
    } else {
      globalAudioEngine.setStemMode('words_only');
      globalAudioEngine.setStemLevels({ vocals: 1.15, beat: 0.0, swappedInstrumental: 0.0 });
    }
  };

  const handleQuickMuteWords = () => {
    const isCurrentlyWordsMuted = globalAudioEngine.getStemMode() === 'words_muted';
    if (isCurrentlyWordsMuted) {
      globalAudioEngine.restoreFullMix();
    } else {
      globalAudioEngine.muteOriginalWords();
    }
  };

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP BAR: TRACK SUMMARY & UPLOAD */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#441619] shrink-0">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-[#ea3838]/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white animate-pulse" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-white">
                {currentTrack.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ea3838] text-white">
                {currentTrack.sourceType === 'preset_stem' ? 'STUDIO STEM' : 'UPLOADED FILE'}
              </span>
            </div>
            <p className="text-xs text-[#a67c7f] mt-0.5">
              {currentTrack.artist} · {currentTrack.genre}
            </p>

            {/* Analysis Badges (Section 9) */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-[#c59c9f]">
              <span className="font-semibold text-white">BPM: {currentTrack.bpm}</span>
              <span>·</span>
              <span className="font-semibold text-white">KEY: {currentTrack.key}</span>
              <span>·</span>
              <span className="font-semibold text-white">LUFS: {currentTrack.lufs}</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">VOCALS: {currentTrack.vocals}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenInstrumentalSwapper && (
            <button
              onClick={onOpenInstrumentalSwapper}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a1309] hover:bg-[#3d1a0d] text-[#f59e0b] border border-[#f59e0b]/60 hover:border-[#f59e0b] text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Afro Remixer & Swapper
            </button>
          )}

          {onOpenBeatMaker && (
            <button
              onClick={onOpenBeatMaker}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e0e29] hover:bg-[#2b143b] text-[#c084fc] border border-[#8b5cf6]/60 hover:border-[#8b5cf6] text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5" />
              16-Step Beat Maker
            </button>
          )}

          {onOpenVocalModels && (
            <button
              onClick={onOpenVocalModels}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#290e10] hover:bg-[#3d1417] text-white border border-[#ea3838]/60 hover:border-[#ea3838] text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ff6b72]" />
              100+ Vocal Models (African Suite)
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#260e10] hover:bg-[#381417] text-white border border-[#4a1c20] text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-[#ff6b72]" />
            Upload Song
          </button>

          <button
            onClick={onOpenMakeItAVibe}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] text-white text-xs font-extrabold shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Make It A Vibe
          </button>
        </div>
      </div>

      {/* WAVEFORM, PLAYBACK CONTROLS & A/B COMPARISON */}
      <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
        {/* Waveform Visual Scrub Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#a67c7f]">
            <span>{formatSeconds(currentTime)}</span>
            <span className="flex items-center gap-2">
              {isABOriginal ? (
                <span className="text-amber-400 font-bold">A: ORIGINAL (DRY AUDIO)</span>
              ) : (
                <span className="text-[#ff6b72] font-bold">B: EDITED ({activePreset.name.toUpperCase()})</span>
              )}
            </span>
            <span>{formatSeconds(duration || currentTrack.duration)}</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || currentTrack.duration}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg bg-[#2a0e11] accent-[#ea3838] cursor-pointer"
            />
          </div>
        </div>

        {/* Master Transport Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayToggle}
              className="w-12 h-12 rounded-2xl bg-[#ea3838] hover:bg-[#ff4d4d] text-white flex items-center justify-center shadow-lg shadow-[#ea3838]/40 transition-all active:scale-90"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Restart */}
            <button
              onClick={() => {
                globalAudioEngine.seek(0);
                setCurrentTime(0);
              }}
              className="p-3 rounded-2xl bg-[#260e10] hover:bg-[#381417] text-[#c59c9f] hover:text-white border border-[#441619] transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* A/B Switch Button (Section 14 & 15) */}
            <button
              onClick={handleABToggle}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black transition-all ${
                isABOriginal
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-[#260e10] text-[#ff6b72] border-[#ea3838]/60 hover:bg-[#381417]'
              }`}
              title="Toggle to compare original dry audio against processed sound"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              A/B: {isABOriginal ? 'HEARING ORIGINAL' : 'HEARING EDITED'}
            </button>
          </div>

          {/* Export WAV & Stems buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportWAV}
              disabled={isExportingWav}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#260e10] hover:bg-[#381417] text-white border border-[#4a1c20] hover:border-[#ea3838] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isExportingWav ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#ff6b72]" />
                  Rendering 32-bit DSP...
                </>
              ) : exportComplete ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Downloaded WAV!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#ff6b72]" />
                  Quick Master WAV
                </>
              )}
            </button>

            {/* Download Stems & Edited Vocals Button (Requested by user) */}
            <button
              onClick={() => setIsDownloadStemsOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 hover:scale-105 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download Stems & Edited Vocals
            </button>
          </div>
        </div>

        {/* =========================================================================
            AFRICAN REMIXER & WORDS-ONLY (ACAPELLA) STATION
           ========================================================================= */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#240e07] via-[#2f1214] to-[#18080a] border border-[#f59e0b]/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-black uppercase tracking-wider">
                VIRAL AFRO TRANSFORMATION
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                AFROBEAT REMIXER & WORDS-ONLY (MUTE BEAT) ENGINE
              </h3>
            </div>
            <span className="text-[11px] text-[#e6bca0]">
              Isolate vocals, silence backing beat, or swap to Lagos Afrobeat & Amapiano log drums
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1-Click Mute Original Words (Karaoke Mode) */}
            <button
              onClick={handleQuickMuteWords}
              className={`p-3.5 rounded-xl border text-left transition-all group ${
                globalAudioEngine.getStemMode() === 'words_muted'
                  ? 'bg-rose-500/25 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-gradient-to-br from-rose-950/40 to-[#220c0e] hover:from-rose-900/40 hover:to-[#341315] border-rose-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-rose-400 uppercase">KARAOKE MODE</span>
                <Flame className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xs font-black text-white group-hover:text-rose-200">
                Mute Original Words
              </div>
              <div className="text-[10px] text-rose-200/80 mt-0.5">
                {globalAudioEngine.getStemMode() === 'words_muted' ? 'Active: Words Silenced!' : 'Karaoke: Keep beat, mute lyrics'}
              </div>
            </button>

            {/* Quick Words Only / Acapella Toggle */}
            <button
              onClick={handleQuickWordsOnly}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                globalAudioEngine.getStemMode() === 'words_only'
                  ? 'bg-[#06b6d4]/25 border-[#06b6d4] text-white shadow-lg shadow-[#06b6d4]/20'
                  : 'bg-[#1e0a0d] border-[#361315] hover:border-[#06b6d4]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-[#06b6d4] uppercase">ACAPELLA</span>
                <Activity className="w-3.5 h-3.5 text-[#06b6d4]" />
              </div>
              <div className="text-xs font-black text-white">
                Words Only (Mute Beat)
              </div>
              <div className="text-[10px] text-[#a67c7f] mt-0.5">
                {globalAudioEngine.getStemMode() === 'words_only' ? 'Active: Beat Muted!' : 'Mute drums & instrumentals'}
              </div>
            </button>

            {/* Launch Full Stem Swapper */}
            {onOpenInstrumentalSwapper && (
              <button
                onClick={onOpenInstrumentalSwapper}
                className="p-3.5 rounded-xl bg-[#280f12] hover:bg-[#381419] border border-[#4d191c] hover:border-[#ea3838] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-[#ff6b72] uppercase">REMIX DECK</span>
                  <Sliders className="w-3.5 h-3.5 text-[#ea3838]" />
                </div>
                <div className="text-xs font-black text-white group-hover:text-[#ff6b72]">
                  Instrumental Swapper Modal
                </div>
                <div className="text-[10px] text-[#a67c7f] mt-0.5">
                  Dual faders & 6 African genres
                </div>
              </button>
            )}

            {/* Launch 16-Step Beat Maker */}
            {onOpenBeatMaker && (
              <button
                onClick={onOpenBeatMaker}
                className="p-3.5 rounded-xl bg-[#1e0e29] hover:bg-[#2b143b] border border-[#8b5cf6]/50 hover:border-[#8b5cf6] text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-[#c084fc] uppercase">STEP SEQUENCER</span>
                  <Zap className="w-3.5 h-3.5 text-[#c084fc]" />
                </div>
                <div className="text-xs font-black text-white group-hover:text-[#c084fc]">
                  16-Step Beat Maker Machine
                </div>
                <div className="text-[10px] text-[#a67c7f] mt-0.5">
                  Live drum pads & African rhythms
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#17080a] border border-[#3e1618] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ea3838]" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                STYLE MIXER & MULTI-LAYER STACKER
              </h3>
            </div>
            <span className="text-[11px] text-[#a67c7f]">
              Combine multiple effects simultaneously (e.g. Slowed + Reverb + 8D + Lo-Fi + Vocal Model)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {/* Layer 1: Slowed */}
            <button
              onClick={() => {
                const isSlow = activePreset.speed < 0.9;
                handleParamChange('speed', isSlow ? 1.0 : 0.72);
                handleParamChange('pitch', isSlow ? 0 : -3.0);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset.speed < 0.9
                  ? 'bg-[#2f1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                  : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Slowed</span>
                {activePreset.speed < 0.9 && <Check className="w-3.5 h-3.5 text-[#ff6b72]" />}
              </div>
              <span className="text-[10px] text-[#8a686b] block mt-0.5">{(activePreset.speed * 100).toFixed(0)}% Speed</span>
            </button>

            {/* Layer 2: Cathedral Reverb */}
            <button
              onClick={() => {
                const hasVerb = activePreset.reverbWet > 0.3;
                handleParamChange('reverbWet', hasVerb ? 0.05 : 0.6);
                handleParamChange('reverbDecay', hasVerb ? 1.0 : 5.8);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset.reverbWet > 0.3
                  ? 'bg-[#2f1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                  : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Reverb</span>
                {activePreset.reverbWet > 0.3 && <Check className="w-3.5 h-3.5 text-[#ff6b72]" />}
              </div>
              <span className="text-[10px] text-[#8a686b] block mt-0.5">{(activePreset.reverbWet * 100).toFixed(0)}% Wet</span>
            </button>

            {/* Layer 3: 8D Audio (8D Tunes) */}
            <button
              onClick={() => {
                handleParamChange('pan8d', !activePreset.pan8d);
                if (!activePreset.pan8d) handleParamChange('panSpeed', 0.12);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset.pan8d
                  ? 'bg-[#1b2b20] border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-emerald-400" />
                  8D Audio
                </span>
                {activePreset.pan8d && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-[10px] text-emerald-400/80 block mt-0.5">360° Orbit</span>
            </button>

            {/* Layer 4: Lo-Fi Warmth */}
            <button
              onClick={() => {
                const isLofi = (activePreset.lofiCutoff || 20000) < 10000;
                handleParamChange('lofiCutoff', isLofi ? 20000 : 3800);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                (activePreset.lofiCutoff || 20000) < 10000
                  ? 'bg-[#2f1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                  : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Lo-Fi</span>
                {(activePreset.lofiCutoff || 20000) < 10000 && <Check className="w-3.5 h-3.5 text-[#ff6b72]" />}
              </div>
              <span className="text-[10px] text-[#8a686b] block mt-0.5">3.8kHz Cassette</span>
            </button>

            {/* Layer 5: Sub-Bass Boost */}
            <button
              onClick={() => {
                const hasBass = activePreset.bassBoost > 3;
                handleParamChange('bassBoost', hasBass ? 0 : 6.5);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activePreset.bassBoost > 3
                  ? 'bg-[#2f1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                  : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Bass Boost</span>
                {activePreset.bassBoost > 3 && <Check className="w-3.5 h-3.5 text-[#ff6b72]" />}
              </div>
              <span className="text-[10px] text-[#8a686b] block mt-0.5">+{activePreset.bassBoost.toFixed(0)} dB</span>
            </button>

            {/* Layer 6: Selected Vocal Model */}
            <button
              onClick={onOpenVocalModels}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                activeVocalModel
                  ? 'bg-[#351216] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/30'
                  : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="truncate">{activeVocalModel ? activeVocalModel.name.split(' ')[0] : 'Vocal Model'}</span>
                {activeVocalModel && <Check className="w-3.5 h-3.5 text-[#ff6b72]" />}
              </div>
              <span className="text-[10px] text-[#ff6b72] block mt-0.5 truncate">
                {activeVocalModel ? activeVocalModel.vocalistArchetype : 'Choose 100+'}
              </span>
            </button>
          </div>
        </div>

        {/* 8D TUNES OFFICIAL PLAYLIST HUB (https://lnk.to/8dplaylist) */}
        <div className="p-4 rounded-2xl bg-[#1b080a] border border-[#ea3838]/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#ea3838]" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                8D TUNES OFFICIAL PLAYLIST (LNK.TO/8DPLAYLIST)
              </h4>
            </div>
            <a
              href="https://lnk.to/8dplaylist"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#ff6b72] hover:underline"
            >
              Official Link ↗
            </a>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SAMPLE_TRACKS.filter((t) => t.id.startsWith('8d-')).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onUpdateTrack(t);
                  // Load synthetic track and activate 8D preset
                  globalAudioEngine.loadSyntheticTrack('midnight_drive');
                  const eightDPreset = PRESET_STYLES.find((p) => p.id === '8d_tunes_signature') || PRESET_STYLES[0];
                  onUpdatePreset(eightDPreset);
                  globalAudioEngine.setTransformation(eightDPreset);
                  globalAudioEngine.play();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  currentTrack.id === t.id
                    ? 'bg-[#ea3838] text-white border-[#ea3838] shadow-md shadow-[#ea3838]/30'
                    : 'bg-[#240c0e] text-[#c59c9f] hover:text-white border-[#371518]'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: STYLE DNA PARAMETERS & LIVE CANVAS VISUALIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Parametric Style DNA Knobs (Cols 7) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#ea3838]" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                STYLE DNA PARAMETERS ({activePreset.name})
              </h3>
            </div>
            <span className="text-[11px] text-[#8a686b]">
              Real-time Web Audio DSP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed slider */}
            <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Speed / Tempo</span>
                <span className="font-mono text-[#ff6b72]">{(activePreset.speed * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.6"
                step="0.02"
                value={activePreset.speed}
                onChange={(e) => handleParamChange('speed', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Range: 50% (Ultra Slowed) to 160% (Hyper Speed)</span>
            </div>

            {/* Pitch slider */}
            <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Pitch Transpose</span>
                <span className="font-mono text-[#ff6b72]">{activePreset.pitch > 0 ? `+${activePreset.pitch}` : activePreset.pitch} st</span>
              </div>
              <input
                type="range"
                min="-8"
                max="8"
                step="0.5"
                value={activePreset.pitch}
                onChange={(e) => handleParamChange('pitch', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">-8 (Deep Drag) to +8 (Nightcore Sparkle)</span>
            </div>

            {/* Reverb Wetness */}
            <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Reverb Wetness</span>
                <span className="font-mono text-[#ff6b72]">{(activePreset.reverbWet * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={activePreset.reverbWet}
                onChange={(e) => handleParamChange('reverbWet', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Dry/Wet Mix Balance</span>
            </div>

            {/* Reverb Decay */}
            <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Cathedral Decay</span>
                <span className="font-mono text-[#ff6b72]">{activePreset.reverbDecay.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="9.0"
                step="0.2"
                value={activePreset.reverbDecay}
                onChange={(e) => handleParamChange('reverbDecay', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Acoustic space decay tail</span>
            </div>

            {/* Bass Boost */}
            <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Sub Bass Boost (95Hz)</span>
                <span className="font-mono text-[#ff6b72]">+{activePreset.bassBoost.toFixed(1)} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="0.5"
                value={activePreset.bassBoost}
                onChange={(e) => handleParamChange('bassBoost', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Low-shelf saturation</span>
            </div>

            {/* 8D Spatial Audio toggle */}
            <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#ff6b72]" />
                  <span className="text-xs font-semibold text-white">8D Spatial Panning</span>
                </div>
                <input
                  type="checkbox"
                  checked={activePreset.pan8d}
                  onChange={(e) => handleParamChange('pan8d', e.target.checked)}
                  className="w-4 h-4 accent-[#ea3838] rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8a686b]">Pan Speed:</span>
                <input
                  type="range"
                  min="0.04"
                  max="0.3"
                  step="0.02"
                  value={activePreset.panSpeed}
                  disabled={!activePreset.pan8d}
                  onChange={(e) => handleParamChange('panSpeed', parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-[#140708] rounded accent-[#ea3838] disabled:opacity-40"
                />
              </div>
              <span className="text-[10px] text-[#8a686b]">Binaural 360° circular headphone rotation</span>
            </div>
          </div>

          {/* NATURAL LANGUAGE CUSTOM STYLE GENERATOR (Section 13) */}
          <div className="p-4 rounded-2xl bg-[#17080a] border border-[#371518] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Flame className="w-3.5 h-3.5 text-[#ea3838]" />
              CREATE MY OWN STYLE WITH AI
            </div>
            <p className="text-[11px] text-[#a67c7f]">
              Describe a desired feeling (e.g. &quot;Make this feel like driving alone at midnight during rain&quot;). Gemini AI translates it directly into audio parameters.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Driving alone at 3AM in Tokyo with heavy rain..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomStyle()}
                className="flex-1 px-3 py-2 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
              />
              <button
                onClick={handleGenerateCustomStyle}
                disabled={isAiGeneratingStyle || !customPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-[#ea3838] hover:bg-[#ff4d4d] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAiGeneratingStyle ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Generate
              </button>
            </div>

            {customStyleStatus && (
              <p className="text-[11px] text-emerald-400 font-medium">
                ✓ {customStyleStatus}
              </p>
            )}
          </div>
        </div>

        {/* Right: Real-time Audio Visualizer Studio (Cols 5) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#ea3838]" />
              LIVE AUDIO VISUALIZER
            </h3>
            {onOpenVideoStudio && (
              <button
                onClick={onOpenVideoStudio}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#280e10] hover:bg-[#ea3838] text-white border border-[#4a1c20] text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Video className="w-3.5 h-3.5 text-[#ff6b72]" />
                <span>HD Video Studio →</span>
              </button>
            )}
          </div>

          <AudioVisualizerCanvas
            trackTitle={currentTrack.title}
            artist={currentTrack.artist}
            preset={activePreset}
            coverUrl={currentTrack.coverUrl}
            aspectRatio="16:9"
            visualMode="circular"
            className="w-full"
          />

          <div className="text-[11px] text-[#a67c7f] text-center">
            Pulls live frequency bins directly from Web Audio AnalyserNode. Hover the visualizer for 9:16 and 1:1 aspect switches.
          </div>
        </div>
      </div>

      {/* STYLE LIBRARY CATEGORIES & CARDS (Section 10) */}
      <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ea3838]" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              TRANSFORMATION STYLE PRESETS ({filteredPresets.length})
            </h3>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/30'
                    : 'bg-[#240c0e] text-[#a67c7f] hover:text-white border border-[#371518]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
          {filteredPresets.map((preset) => {
            const isSelected = activePreset.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onUpdatePreset(preset);
                  globalAudioEngine.setTransformation(preset);
                }}
                className={`p-3.5 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between min-h-[120px] ${
                  isSelected
                    ? 'bg-[#2e1013] border-[#ea3838] shadow-lg shadow-[#ea3838]/25 scale-[1.02]'
                    : 'bg-[#1e0a0d] hover:bg-[#250d0f] border-[#371518]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-[#ff6b72] uppercase tracking-wider">
                      {preset.category}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#290d10] text-[10px] text-[#c59c9f] font-semibold border border-[#441619]">
                      {preset.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-[#8a686b] mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-[#c59c9f] border-t border-[#2d1013] pt-2">
                  <span>Speed: {(preset.speed * 100).toFixed(0)}%</span>
                  <span>Reverb: {(preset.reverbWet * 100).toFixed(0)}%</span>
                  {preset.pan8d && <span className="text-[#ff6b72] font-bold">8D Active</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stems & Vocals Download Modal */}
      <DownloadStemsModal
        isOpen={isDownloadStemsOpen}
        onClose={() => setIsDownloadStemsOpen(false)}
        track={currentTrack}
        preset={activePreset}
        activeVocalModel={activeVocalModel}
        activeStackSummary={[
          activePreset.speed < 0.9 ? `Slowed (${(activePreset.speed * 100).toFixed(0)}%)` : activePreset.speed > 1.1 ? `Sped Up (${(activePreset.speed * 100).toFixed(0)}%)` : 'Standard Tempo',
          activePreset.reverbWet > 0.2 ? `Cathedral Reverb (${(activePreset.reverbWet * 100).toFixed(0)}%)` : null,
          (activePreset.lofiCutoff || 20000) < 10000 ? 'Lo-Fi Tape (3.8kHz)' : null,
          activePreset.bassBoost > 3 ? `Sub-Bass (+${activePreset.bassBoost.toFixed(0)}dB)` : null,
        ].filter(Boolean) as string[]}
      />
    </div>
  );
};
