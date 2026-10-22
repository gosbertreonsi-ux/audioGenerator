import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Layers, 
  Sparkles, 
  Check, 
  Loader2, 
  X, 
  Zap, 
  Disc, 
  Activity, 
  ArrowRightLeft,
  FastForward,
  Headphones,
  RotateCcw,
  FileMusic,
  FolderSync
} from 'lucide-react';
import { globalDualAudioEngine, DualTrackItem, DualSyncConfig, DualEngineState } from '../../lib/dualAudioEngine';
import { AudioTrack } from '../../types';
import { globalAudioEngine } from '../../lib/audioEngine';

// Real-Time Dual Beat Phase & Quantization Oscilloscope
const DualBeatOscilloscope: React.FC<{
  isPlaying: boolean;
  targetBpm: number;
  trackA: DualTrackItem | null;
  trackB: DualTrackItem | null;
  gainReductionDb: number;
}> = ({ isPlaying, targetBpm, trackA, trackB, gainReductionDb }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#140608';
      ctx.fillRect(0, 0, width, height);

      const beatFreq = targetBpm / 60; // Hz
      if (isPlaying) {
        phase += beatFreq * 0.04;
      }

      // Vertical beat grid lines (8 bars)
      const numGridBars = 8;
      for (let b = 0; b <= numGridBars; b++) {
        const x = (b / numGridBars) * width;
        ctx.strokeStyle = b % 4 === 0 ? '#4d191d' : '#220b0d';
        ctx.lineWidth = b % 4 === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const midY = height / 2;

      // 1. Track A (Red Waveform)
      if (trackA) {
        ctx.beginPath();
        ctx.strokeStyle = '#ea3838';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x++) {
          const t = (x / width) * 4 * Math.PI + phase * 2 * Math.PI;
          const beatPulse = Math.pow(Math.max(0, Math.sin(t)), 6) * (isPlaying ? 1.0 : 0.4);
          const y = midY - 18 + Math.sin(t * 1.5) * 6 - beatPulse * 16;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 2. Track B (Cyan Waveform)
      if (trackB) {
        ctx.beginPath();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x++) {
          const t = (x / width) * 4 * Math.PI + phase * 2 * Math.PI;
          const beatPulse = Math.pow(Math.max(0, Math.sin(t)), 6) * (isPlaying ? 1.0 : 0.4);
          const y = midY + 18 + Math.sin(t * 2.0) * 6 + beatPulse * 16;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 3. Combined & Compressed Master Pulse (Gold/Amber)
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      for (let x = 0; x < width; x++) {
        const t = (x / width) * 4 * Math.PI + phase * 2 * Math.PI;
        const beatPunch = Math.pow(Math.max(0, Math.sin(t)), 8) * 1.35;
        const rawWave = Math.sin(t * 2) * 0.4 + beatPunch;
        const compressed = Math.tanh(rawWave * 1.3) * 18;
        const y = midY + (isPlaying ? -compressed : -compressed * 0.3);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Downbeat flash
      const beatCycle = phase % 1;
      if (isPlaying && beatCycle < 0.15) {
        const flashAlpha = 1.0 - (beatCycle / 0.15);
        ctx.fillStyle = `rgba(234, 56, 56, ${flashAlpha * 0.18})`;
        ctx.fillRect(0, 0, width, height);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, targetBpm, trackA, trackB, gainReductionDb]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#3b1519] bg-[#140608] shadow-inner">
      <canvas
        ref={canvasRef}
        width={720}
        height={85}
        className="w-full h-20 block"
      />
      <div className="absolute top-2 left-3 flex flex-wrap items-center gap-3 pointer-events-none">
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#ff6b72]">
          <span className="w-2 h-2 rounded-full bg-[#ea3838]" /> Song A Beat {trackA ? `(${trackA.nativeBpm} BPM)` : ''}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#06b6d4]">
          <span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> Song B Beat {trackB ? `(${trackB.nativeBpm} BPM)` : ''}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Glued & Compressed Master
        </span>
      </div>
      <div className="absolute top-2 right-3 pointer-events-none flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#290d10] text-[#ff7b82] border border-[#44161a]">
          LOCKED: {(targetBpm / 60).toFixed(3)} Hz ({targetBpm} BPM)
        </span>
      </div>
    </div>
  );
};

interface DualSongSyncViewProps {
  currentTrack?: AudioTrack;
  onOpenQuickUpload?: () => void;
  onOpenStudio?: () => void;
  onSendToStudio?: (track: AudioTrack) => void;
}

export const DualSongSyncView: React.FC<DualSongSyncViewProps> = ({
  currentTrack,
  onOpenQuickUpload,
  onOpenStudio,
  onSendToStudio,
}) => {
  const [engineState, setEngineState] = useState<DualEngineState>(globalDualAudioEngine.getState());
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isLoadingAltare, setIsLoadingAltare] = useState(false);
  const [autoPreview, setAutoPreview] = useState(true);
  const [isSendingToStudio, setIsSendingToStudio] = useState(false);
  const [isDraggingJoint, setIsDraggingJoint] = useState(false);
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);
  const [activeTab, setActiveTab] = useState<'mixer' | 'compressor' | 'stems'>('mixer');

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const fileInputJointRef = useRef<HTMLInputElement>(null);

  // Subscribe to Dual Audio Engine state changes
  useEffect(() => {
    const unsub = globalDualAudioEngine.subscribe((st) => {
      setEngineState(st);
    });
    return unsub;
  }, []);

  const { trackA, trackB, config, isPlaying, currentTime, duration, gainReductionDb } = engineState;

  // Handle uploading Song A
  const handleUploadA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await globalDualAudioEngine.loadTrackA(file);
      const st = globalDualAudioEngine.getState();
      if (st.trackB && autoPreview) {
        await globalDualAudioEngine.play();
      }
    } catch (err) {
      console.error('Failed to load track A:', err);
    }
  };

  // Handle uploading Song B
  const handleUploadB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await globalDualAudioEngine.loadTrackB(file);
      const st = globalDualAudioEngine.getState();
      if (st.trackA && autoPreview) {
        await globalDualAudioEngine.play();
      }
    } catch (err) {
      console.error('Failed to load track B:', err);
    }
  };

  // Handle uploading both songs simultaneously
  const handleUploadJoint = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      if (files.length === 1) {
        const st = globalDualAudioEngine.getState();
        if (!st.trackA) {
          await globalDualAudioEngine.loadTrackA(files[0]);
          if (globalDualAudioEngine.getState().trackB && autoPreview) {
            await globalDualAudioEngine.play();
          }
        } else {
          await globalDualAudioEngine.loadTrackB(files[0]);
          if (autoPreview) {
            await globalDualAudioEngine.play();
          }
        }
      } else {
        await globalDualAudioEngine.loadTrackA(files[0]);
        await globalDualAudioEngine.loadTrackB(files[1]);
        if (autoPreview) {
          await globalDualAudioEngine.play();
        }
      }
    } catch (err) {
      console.error('Failed to load dual tracks:', err);
    }
  };

  // Handle loading Ariana "bye" x Altare Future Bass / Trap Flip demo pair
  const handleLoadArianaAltareDemoPair = async () => {
    try {
      setIsLoadingAltare(true);
      await globalDualAudioEngine.loadArianaAltareByeDemoPair();
    } catch (err) {
      console.error('Failed to load Ariana Altare demo pair:', err);
    } finally {
      setIsLoadingAltare(false);
    }
  };

  // Handle loading synthwave demo song pair (116 BPM & 144 BPM)
  const handleLoadDemoPair = async () => {
    try {
      setIsLoadingDemo(true);
      await globalDualAudioEngine.loadDemoPair();
      if (autoPreview) await globalDualAudioEngine.play();
    } catch (err) {
      console.error('Failed to load demo pair:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // 1-click apply Altare "bye" production configuration
  const handleApplyAltarePreset = () => {
    globalDualAudioEngine.applyAltareArianaByePreset();
  };

  // Quick load currently active single-track from globalAudioEngine into Track A
  const handleLoadCurrentIntoA = () => {
    const activeBuf = globalAudioEngine.getCurrentBuffer();
    if (activeBuf && currentTrack && currentTrack.id !== 'unloaded') {
      globalDualAudioEngine.loadTrackA(activeBuf, {
        name: currentTrack.title,
        artist: currentTrack.artist,
      });
    } else {
      onOpenQuickUpload?.();
    }
  };

  // Export synchronized and compressed dual mashup WAV
  const handleExportWAV = async () => {
    if (!trackA && !trackB) return;
    try {
      setIsExporting(true);
      const wavBlob = await globalDualAudioEngine.renderAndExportDualWAV();
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      const titleA = trackA?.name.replace(/\s+/g, '_') || 'SongA';
      const titleB = trackB?.name.replace(/\s+/g, '_') || 'SongB';
      a.download = `MASHUP_${titleA}_x_${titleB}_${config.targetBpm}BPM_SYNCED_COMPRESSED.wav`;
      a.click();
      URL.revokeObjectURL(url);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Transfer synchronized dual mix into Studio Engine for deep edits & download
  const handleSendMixToStudio = async () => {
    if (!trackA && !trackB) return;
    try {
      setIsSendingToStudio(true);
      globalDualAudioEngine.pause();
      const renderedBuffer = await globalDualAudioEngine.renderDualBuffer();
      await globalAudioEngine.loadAudioBuffer(renderedBuffer);

      const titleA = trackA?.name || 'Song A';
      const titleB = trackB?.name || 'Song B';
      const mashupTrack: AudioTrack = {
        id: `mashup_${Date.now()}`,
        title: `${titleA} x ${titleB} (Beat-Synced Mix)`,
        artist: 'Dual Engine Mashup',
        duration: Math.round(renderedBuffer.duration),
        bpm: config.targetBpm,
        key: 'Multi-Key',
        energy: 'High',
        vocals: 'Detected',
        lufs: -14,
        genre: 'Beat Sync Mashup',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        sourceType: 'user_upload',
      };

      if (onSendToStudio) {
        onSendToStudio(mashupTrack);
      } else if (onOpenStudio) {
        onOpenStudio();
      }
    } catch (err) {
      console.error('Failed to send mix to studio:', err);
    } finally {
      setIsSendingToStudio(false);
    }
  };

  // Transfer single track (Song A or Song B) into Studio Engine for deep edits & download
  const handleSendTrackToStudio = async (slot: 'a' | 'b') => {
    const track = slot === 'a' ? trackA : trackB;
    if (!track || !track.buffer) return;
    try {
      setIsSendingToStudio(true);
      globalDualAudioEngine.pause();
      await globalAudioEngine.loadAudioBuffer(track.buffer);
      const newTrack: AudioTrack = {
        id: `slot_${slot}_${Date.now()}`,
        title: track.name,
        artist: track.artist || (slot === 'a' ? 'Song A' : 'Song B'),
        duration: Math.round(track.buffer.duration),
        bpm: track.nativeBpm || 120,
        key: '--',
        energy: 'Medium',
        vocals: track.stemMode === 'beat_only' ? 'Instrumental Only' : 'Detected',
        lufs: -14,
        genre: 'Studio Master',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        sourceType: 'user_upload',
      };
      if (onSendToStudio) {
        onSendToStudio(newTrack);
      } else if (onOpenStudio) {
        onOpenStudio();
      }
    } catch (err) {
      console.error(`Failed to send track ${slot} to studio:`, err);
    } finally {
      setIsSendingToStudio(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Rate multipliers
  const rateA = trackA ? (config.targetBpm / trackA.nativeBpm).toFixed(3) : '1.000';
  const rateB = trackB ? (config.targetBpm / trackB.nativeBpm).toFixed(3) : '1.000';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#120607] text-[#f4e8e8] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / HUD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#240a0e] via-[#1a0709] to-[#2b0d11] border border-[#ea3838]/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea3838]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#ea3838]/30">
              DUAL BEAT-FREQUENCY SYNC & BUS COMPRESSION
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#2a0e11] text-[#ff7b82] text-[10px] font-mono border border-[#44161a]">
              f_beat = {(config.targetBpm / 60).toFixed(3)} Hz
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            2-SONG BEAT FREQUENCY SYNCHRONIZER & GLUE LAB
          </h1>
          <p className="text-xs text-[#a67c7f] max-w-2xl leading-relaxed">
            Upload two distinct songs. Their beats are locked to the <strong className="text-white">exact same beat frequency</strong> ({config.targetBpm} BPM / {(config.targetBpm / 60).toFixed(2)} Hz) and glued together through dual-stage beat punch & bus compression.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleLoadArianaAltareDemoPair}
            disabled={isLoadingAltare}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#ea3838] via-[#ff3b47] to-amber-500 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95 disabled:opacity-40 cursor-pointer border border-amber-300/40"
            title="Load Ariana Grande - bye (Vocals) x Altare (145 BPM Wave/Trap Drop) with instant simultaneous preview"
          >
            {isLoadingAltare ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Loading Ariana 'bye' Flip...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white fill-current animate-pulse" />
                <span>Load Ariana 'bye' (Altare Flip)</span>
              </>
            )}
          </button>

          <button
            onClick={handleLoadDemoPair}
            disabled={isLoadingDemo}
            className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-[#2b1013] hover:bg-[#3d1519] border border-[#5a1c22] hover:border-[#ea3838] text-[#d4abb0] hover:text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            title="Load two demo tracks (116 BPM & 144 BPM) to test beat sync and compression"
          >
            {isLoadingDemo ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#ff6b72]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Synthwave Demo</span>
          </button>

          <button
            onClick={() => globalDualAudioEngine.togglePlay()}
            disabled={!trackA && !trackB}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-xs shadow-xl transition-all cursor-pointer disabled:opacity-40 ${
              isPlaying
                ? 'bg-[#290d10] text-[#ff6b72] border border-[#ea3838] hover:bg-[#3d1317]'
                : 'bg-gradient-to-r from-[#ea3838] to-[#ff4747] text-white hover:brightness-110 shadow-[#ea3838]/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE SYNC MIX</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY BEAT-SYNCED</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendMixToStudio}
            disabled={(!trackA && !trackB) || isSendingToStudio}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff3b47] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#ea3838]/30 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            title="Transfer synchronized 2-song audio into Studio Engine to apply 8D audio, slowed reverb, bass boost, and download"
          >
            {isSendingToStudio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Preparing Studio Engine...</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4 text-white" />
                <span>Edit in Studio Engine & Download</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportWAV}
            disabled={(!trackA && !trackB) || isExporting}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2a0f12] hover:bg-[#3a1519] border border-[#4d191d] hover:border-[#ea3838] text-white text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#ff6b72]" />
                <span>Rendering 32-bit WAV...</span>
              </>
            ) : exportComplete ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded WAV!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#ff6b72]" />
                <span>Download Synced WAV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Beat Frequency & Synchronizer Controls */}
      <div className="p-5 rounded-3xl bg-[#19090b] border border-[#371518] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d1013] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#ea3838]" />
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              TARGET BEAT FREQUENCY CONTROLLER (QUANTIZATION MASTER)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#a67c7f]">Beat Period:</span>
            <span className="font-mono text-[#ff7b82] font-bold">{(60000 / config.targetBpm).toFixed(1)} ms</span>
            <span className="text-[#4b1d22]">|</span>
            <span className="text-[#a67c7f]">Beat Freq:</span>
            <span className="font-mono text-[#ff7b82] font-bold">{(config.targetBpm / 60).toFixed(3)} Hz</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Target BPM Slider */}
          <div className="md:col-span-6 p-4 rounded-2xl bg-[#220c0f] border border-[#3b1519] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Target Common Beat Tempo</span>
              <span className="font-mono text-base font-black text-[#ff6b72]">
                {config.targetBpm} <span className="text-xs font-normal text-[#a67c7f]">BPM</span>
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="175"
              step="1"
              value={config.targetBpm}
              onChange={(e) => globalDualAudioEngine.setTargetBpm(parseInt(e.target.value))}
              className="w-full h-2 bg-[#140608] rounded-lg accent-[#ea3838] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8a686b]">
              <span>70 BPM (Slow Hip-Hop)</span>
              <span>128 BPM (House / EDM)</span>
              <span>175 BPM (Drum & Bass)</span>
            </div>
          </div>

          {/* Sync Mode Presets */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => globalDualAudioEngine.setSyncMode('match_a')}
              disabled={!trackA}
              className={`p-3 rounded-2xl border text-left transition-all ${
                config.syncMode === 'match_a'
                  ? 'bg-[#311115] border-[#ea3838] text-white shadow-lg shadow-[#ea3838]/20'
                  : 'bg-[#200b0e] border-[#361417] text-[#a67c7f] hover:text-white disabled:opacity-40'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-[#ff6b72] block">Match Song A</span>
              <span className="text-xs font-black mt-0.5 block truncate">
                {trackA ? `${trackA.nativeBpm} BPM` : 'No Track A'}
              </span>
            </button>

            <button
              onClick={() => globalDualAudioEngine.setSyncMode('match_b')}
              disabled={!trackB}
              className={`p-3 rounded-2xl border text-left transition-all ${
                config.syncMode === 'match_b'
                  ? 'bg-[#311115] border-[#ea3838] text-white shadow-lg shadow-[#ea3838]/20'
                  : 'bg-[#200b0e] border-[#361417] text-[#a67c7f] hover:text-white disabled:opacity-40'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-[#ff6b72] block">Match Song B</span>
              <span className="text-xs font-black mt-0.5 block truncate">
                {trackB ? `${trackB.nativeBpm} BPM` : 'No Track B'}
              </span>
            </button>

            <button
              onClick={() => globalDualAudioEngine.setSyncMode('average')}
              disabled={!trackA || !trackB}
              className={`p-3 rounded-2xl border text-left transition-all ${
                config.syncMode === 'average'
                  ? 'bg-[#311115] border-[#ea3838] text-white shadow-lg shadow-[#ea3838]/20'
                  : 'bg-[#200b0e] border-[#361417] text-[#a67c7f] hover:text-white disabled:opacity-40'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-[#ff6b72] block">Average Both</span>
              <span className="text-xs font-black mt-0.5 block">
                {trackA && trackB ? `${Math.round((trackA.nativeBpm + trackB.nativeBpm) / 2)} BPM` : 'Need Both'}
              </span>
            </button>

            <button
              onClick={() => globalDualAudioEngine.setTargetBpm(140)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                config.targetBpm === 140
                  ? 'bg-[#311115] border-[#ea3838] text-white shadow-lg shadow-[#ea3838]/20'
                  : 'bg-[#200b0e] border-[#361417] text-[#a67c7f] hover:text-white'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-[#ff6b72] block">Club 140 BPM</span>
              <span className="text-xs font-black mt-0.5 block">2.33 Hz Trap</span>
            </button>
          </div>
        </div>

        {/* Real-Time Beat Frequency Phase & Compression Oscilloscope */}
        <DualBeatOscilloscope
          isPlaying={isPlaying}
          targetBpm={config.targetBpm}
          trackA={trackA}
          trackB={trackB}
          gainReductionDb={gainReductionDb}
        />
      </div>

      {/* JOINT 2-SONG UPLOAD DROPZONE BANNER */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDraggingJoint(true); }}
        onDragLeave={() => setIsDraggingJoint(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingJoint(false);
          if (e.dataTransfer.files) handleUploadJoint(e.dataTransfer.files);
        }}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDraggingJoint
            ? 'border-[#ea3838] bg-[#3a1216] scale-[1.01]'
            : 'border-[#44161a] bg-gradient-to-r from-[#210c0e] via-[#1a080a] to-[#250d10] hover:border-[#ea3838]/70'
        }`}
      >
        <input
          ref={fileInputJointRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => {
            if (e.target.files) handleUploadJoint(e.target.files);
          }}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2f1013] border border-[#ea3838]/40 flex items-center justify-center text-[#ff6b72] shadow-md shrink-0">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Drop 2 Songs Together (Deck A & Deck B)</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ea3838]/30 text-[#ff7b82] text-[9px] uppercase font-mono">
                Auto-Quantize
              </span>
            </h4>
            <p className="text-[11px] text-[#a67c7f] mt-0.5">
              Select or drop two audio files (MP3, WAV, FLAC). First song assigns to Deck A, second song to Deck B.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputJointRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] text-white text-xs font-black shadow-md hover:brightness-110 cursor-pointer transition-all active:scale-95"
          >
            Select 2 Audio Files
          </button>
        </div>
      </div>

      {/* =========================================================================
          SIMULTANEOUS DUAL PREVIEW & ALTARE 'BYE' COMPRESSION MASTER STATION
         ========================================================================= */}
      {trackA && trackB ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#240a0e] via-[#330f14] to-[#1c0709] border-2 border-[#ea3838] shadow-[0_0_60px_rgba(234,56,56,0.3)] space-y-5 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#ea3838]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Row */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#4d161b] pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ea3838] text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-[#ea3838]/40 animate-pulse">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  SIMULTANEOUS DUAL PREVIEW ACTIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#1b080a] text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  PHASE LOCKED: {(config.targetBpm / 60).toFixed(3)} Hz ({config.targetBpm} BPM)
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span className="text-[#ff6b72] truncate max-w-[260px]">{trackA.name}</span>
                <span className="text-[#a67c7f] text-sm">×</span>
                <span className="text-[#06b6d4] truncate max-w-[260px]">{trackB.name}</span>
              </h2>
              <p className="text-xs text-[#cfa8ab]">
                Both songs preview simultaneously with dynamic beat-matching, bus compression, and sidechain pumping.
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b0709] border border-[#3f1418] text-xs text-[#d4abb0] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPreview}
                  onChange={(e) => setAutoPreview(e.target.checked)}
                  className="rounded accent-[#ea3838] cursor-pointer"
                />
                <span>Auto-play on select</span>
              </label>

              <button
                onClick={handleApplyAltarePreset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-[#ea3838] to-[#ff3b47] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#ea3838]/30 transition-all active:scale-95 cursor-pointer border border-amber-300/40"
                title="Isolate Ariana vocals on Song A, 808 drop on Song B, lock 145 BPM, sidechain ducking & glue compression"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Apply Altare 'bye' Style (145 BPM Flip)</span>
              </button>
            </div>
          </div>

          {/* Primary Preview Player Bar */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#150608]/80 p-4 rounded-2xl border border-[#3d1317]">
            {/* Giant Play/Pause preview button */}
            <div className="md:col-span-5 flex items-center gap-2.5">
              <button
                onClick={() => globalDualAudioEngine.togglePlay()}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-2xl transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-[#290d10] text-[#ff6b72] border-2 border-[#ea3838] hover:bg-[#3d1317]'
                    : 'bg-gradient-to-r from-[#ea3838] via-[#ff3b47] to-[#ff5c5c] text-white hover:brightness-110 shadow-lg shadow-[#ea3838]/40 scale-[1.02]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>PAUSE DUAL PREVIEW</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current animate-pulse" />
                    <span>PLAY BOTH SONGS TOGETHER</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => globalDualAudioEngine.seek(0)}
                className="p-3.5 rounded-2xl bg-[#200b0e] hover:bg-[#311115] border border-[#3e1418] text-[#a67c7f] hover:text-white transition-all cursor-pointer"
                title="Restart preview from 0:00"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Time progress bar */}
            <div className="md:col-span-4 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[#ff6b72] font-bold">{formatTime(currentTime)}</span>
                <span className="text-[10px] text-[#a67c7f] uppercase font-bold tracking-wider">
                  {isPlaying ? 'Live Quantized Preview' : 'Preview Paused'}
                </span>
                <span className="font-mono text-[#a67c7f]">{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => globalDualAudioEngine.seek(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#200a0d] rounded-lg accent-[#ea3838] cursor-pointer"
              />
            </div>

            {/* Crossfader control */}
            <div className="md:col-span-3 space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#ff6b72]">Song A ({Math.round((1 - config.crossfader) * 100)}%)</span>
                <span className="text-[#06b6d4]">Song B ({Math.round(config.crossfader * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.crossfader}
                onChange={(e) => globalDualAudioEngine.setCrossfader(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#200a0d] rounded-lg accent-[#ff6b72] cursor-pointer"
              />
            </div>
          </div>

          {/* Master Download Action Strip */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#d4abb0] font-medium">Chain:</span>
              <span className="px-2 py-0.5 rounded-lg bg-[#220a0d] border border-[#3e1418] text-[10px] font-mono text-white font-bold">
                {config.targetBpm} BPM
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#220a0d] border border-[#3e1418] text-[10px] font-mono text-[#ff7b82] font-bold">
                Sidechain: {config.sidechainSource !== 'none' ? `${Math.round(config.sidechainDepth * 100)}% Ducking` : 'Off'}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#220a0d] border border-[#3e1418] text-[10px] font-mono text-amber-400 font-bold">
                Glue: {config.glueThreshold} dB (Ratio {config.glueRatio}:1)
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-[#220a0d] border border-[#3e1418] text-[10px] font-mono text-emerald-400 font-bold">
                Limiter: -9 LUFS
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleExportWAV}
                disabled={isExporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black text-xs font-black shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Rendering Compressed WAV...</span>
                  </>
                ) : exportComplete ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Downloaded Compressed Master!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-black" />
                    <span>Download Compressed Master (WAV)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSendMixToStudio}
                disabled={isSendingToStudio}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#280c10] hover:bg-[#381216] border border-[#4d191d] hover:border-[#ea3838] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                title="Open this dual mix in Studio Engine for 8D audio, slowed reverb, and vocal chains"
              >
                <Sliders className="w-4 h-4 text-[#ff6b72]" />
                <span>Open in Studio Engine</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-[#1b080b]/80 border border-[#361316] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#280d10] border border-[#44161a] flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {trackA ? 'Now select or upload Song B to preview both together' : trackB ? 'Now select or upload Song A to preview both together' : 'Select 2 songs to preview simultaneously & download compressed master'}
              </h4>
              <p className="text-xs text-[#a67c7f] mt-0.5">
                Drop two files above or load the Ariana Grande - bye (Altare Flip) demo pair to test instantly.
              </p>
            </div>
          </div>

          <button
            onClick={handleLoadArianaAltareDemoPair}
            disabled={isLoadingAltare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] hover:brightness-110 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {isLoadingAltare ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Zap className="w-4 h-4 fill-current text-white" />
            )}
            <span>Load Ariana 'bye' (Altare Flip) Demo</span>
          </button>
        </div>
      )}

      {/* DUAL TRACK DECKS: SONG A vs SONG B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================== */}
        {/* DECK A (SONG A) */}
        {/* ========================================== */}
        <div className="p-5 rounded-3xl bg-[#1b090c] border border-[#3d161a] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#ea3838] text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#ea3838]/30">
                A
              </span>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide">
                  SONG A (TRACK 1)
                </h3>
                <span className="text-[11px] text-[#8a686b]">
                  {trackA ? `${trackA.name}` : 'No song loaded yet'}
                </span>
              </div>
            </div>

            {trackA && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSendTrackToStudio('a')}
                  disabled={isSendingToStudio}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2b0e12] hover:bg-[#3d1318] text-[#ff7b82] hover:text-white border border-[#4d191d] text-[11px] font-bold transition-all cursor-pointer"
                  title="Send Song A to Studio Engine to edit & download"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit in Studio</span>
                </button>
                <button
                  onClick={() => globalDualAudioEngine.removeTrack('a')}
                  className="p-1.5 rounded-lg bg-[#270e11] hover:bg-[#3d1418] text-[#a67c7f] hover:text-white transition-all cursor-pointer"
                  title="Remove Song A"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!trackA ? (
            /* Upload Dropzone for Song A */
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingA(true); }}
              onDragLeave={() => setIsDraggingA(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDraggingA(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  await globalDualAudioEngine.loadTrackA(file);
                  const st = globalDualAudioEngine.getState();
                  if (st.trackB && autoPreview) {
                    await globalDualAudioEngine.play();
                  }
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 ${
                isDraggingA
                  ? 'border-[#ea3838] bg-[#3d1317] scale-[1.02]'
                  : 'border-[#44161a] hover:border-[#ea3838] bg-[#200b0e]/60'
              }`}
            >
              <input
                ref={fileInputARef}
                type="file"
                accept="audio/*"
                onChange={handleUploadA}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#2d0f13] border border-[#ea3838]/40 flex items-center justify-center text-[#ff6b72] mx-auto shadow-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Upload Song A</h4>
                <p className="text-xs text-[#a67c7f] mt-1">Drag & drop or choose MP3, WAV, FLAC</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => fileInputARef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4d4d] text-white text-xs font-bold shadow-md cursor-pointer hover:brightness-110"
                >
                  Choose Song A File
                </button>
                {currentTrack && currentTrack.id !== 'unloaded' && (
                  <button
                    onClick={handleLoadCurrentIntoA}
                    className="px-3.5 py-2 rounded-xl bg-[#2e1014] hover:bg-[#3e151a] text-[#ff7b82] border border-[#521c21] text-xs font-bold cursor-pointer"
                  >
                    Use Studio Track ({currentTrack.title.slice(0, 14)}...)
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Controls for Song A */
            <div className="space-y-4">
              {/* Native Specs Badge */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#240c0f] border border-[#3b1519]">
                  <span className="text-[10px] text-[#8a686b] block">Native BPM</span>
                  <span className="text-sm font-mono font-bold text-white">{trackA.nativeBpm} BPM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#240c0f] border border-[#3b1519]">
                  <span className="text-[10px] text-[#8a686b] block">Beat Frequency</span>
                  <span className="text-sm font-mono font-bold text-[#ff6b72]">{trackA.beatFrequencyHz.toFixed(3)} Hz</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#240c0f] border border-[#3b1519]">
                  <span className="text-[10px] text-[#8a686b] block">Rate Multiplier</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{rateA}x</span>
                </div>
              </div>

              {/* Stem Isolation Modes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a67c7f]">Stem Layer Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => globalDualAudioEngine.setTrackStemMode('a', 'full')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      trackA.stemMode === 'full'
                        ? 'bg-[#ea3838] text-white border-[#ea3838] shadow-md shadow-[#ea3838]/30'
                        : 'bg-[#240c0f] text-[#a67c7f] border-[#371518] hover:text-white'
                    }`}
                  >
                    Full Mix
                  </button>
                  <button
                    onClick={() => globalDualAudioEngine.setTrackStemMode('a', 'beat_only')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      trackA.stemMode === 'beat_only'
                        ? 'bg-[#ea3838] text-white border-[#ea3838] shadow-md shadow-[#ea3838]/30'
                        : 'bg-[#240c0f] text-[#a67c7f] border-[#371518] hover:text-white'
                    }`}
                  >
                    Beat Only (Words Muted)
                  </button>
                  <button
                    onClick={() => globalDualAudioEngine.setTrackStemMode('a', 'words_only')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      trackA.stemMode === 'words_only'
                        ? 'bg-[#ea3838] text-white border-[#ea3838] shadow-md shadow-[#ea3838]/30'
                        : 'bg-[#240c0f] text-[#a67c7f] border-[#371518] hover:text-white'
                    }`}
                  >
                    Words Only (Acapella)
                  </button>
                </div>
              </div>

              {/* Volume & Beat Nudge Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">Song A Volume</span>
                    <span className="font-mono text-[#ff6b72]">{(trackA.volume * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={trackA.volume}
                    onChange={(e) => globalDualAudioEngine.setTrackVolume('a', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">Downbeat Nudge</span>
                    <span className="font-mono text-[#ff6b72]">{trackA.beatOffsetMs > 0 ? `+${trackA.beatOffsetMs}` : trackA.beatOffsetMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="-800"
                    max="800"
                    step="20"
                    value={trackA.beatOffsetMs}
                    onChange={(e) => globalDualAudioEngine.setBeatOffsetMs('a', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#ea3838] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* DECK B (SONG B) */}
        {/* ========================================== */}
        <div className="p-5 rounded-3xl bg-[#1b090c] border border-[#3d161a] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#06b6d4] text-black font-black text-xs flex items-center justify-center shadow-md shadow-[#06b6d4]/30">
                B
              </span>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide">
                  SONG B (TRACK 2)
                </h3>
                <span className="text-[11px] text-[#8a686b]">
                  {trackB ? `${trackB.name}` : 'No song loaded yet'}
                </span>
              </div>
            </div>

            {trackB && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSendTrackToStudio('b')}
                  disabled={isSendingToStudio}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0c242c] hover:bg-[#123642] text-[#06b6d4] hover:text-white border border-[#164e63] text-[11px] font-bold transition-all cursor-pointer"
                  title="Send Song B to Studio Engine to edit & download"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit in Studio</span>
                </button>
                <button
                  onClick={() => globalDualAudioEngine.removeTrack('b')}
                  className="p-1.5 rounded-lg bg-[#270e11] hover:bg-[#3d1418] text-[#a67c7f] hover:text-white transition-all cursor-pointer"
                  title="Remove Song B"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!trackB ? (
            /* Upload Dropzone for Song B */
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingB(true); }}
              onDragLeave={() => setIsDraggingB(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDraggingB(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  await globalDualAudioEngine.loadTrackB(file);
                  const st = globalDualAudioEngine.getState();
                  if (st.trackA && autoPreview) {
                    await globalDualAudioEngine.play();
                  }
                }
              }}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 ${
                isDraggingB
                  ? 'border-[#06b6d4] bg-[#0c242c] scale-[1.02]'
                  : 'border-[#44161a] hover:border-[#06b6d4] bg-[#200b0e]/60'
              }`}
            >
              <input
                ref={fileInputBRef}
                type="file"
                accept="audio/*"
                onChange={handleUploadB}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#2d0f13] border border-[#06b6d4]/40 flex items-center justify-center text-[#06b6d4] mx-auto shadow-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Upload Song B</h4>
                <p className="text-xs text-[#a67c7f] mt-1">Drag & drop or choose MP3, WAV, FLAC</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => fileInputBRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-black font-bold text-xs shadow-md cursor-pointer hover:brightness-110"
                >
                  Choose Song B File
                </button>
              </div>
            </div>
          ) : (
            /* Controls for Song B */
            <div className="space-y-4">
              {/* Native Specs Badge */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#240c0f] border border-[#3b1519]">
                  <span className="text-[10px] text-[#8a686b] block">Native BPM</span>
                  <span className="text-sm font-mono font-bold text-white">{trackB.nativeBpm} BPM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#240c0f] border border-[#3b1519]">
                  <span className="text-[10px] text-[#8a686b] block">Beat Frequency</span>
                  <span className="text-sm font-mono font-bold text-[#06b6d4]">{trackB.beatFrequencyHz.toFixed(3)} Hz</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#240c0f] border border-[#3b1519]">
                  <span className="text-[10px] text-[#8a686b] block">Rate Multiplier</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{rateB}x</span>
                </div>
              </div>

              {/* Stem Isolation Modes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#a67c7f]">Stem Layer Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => globalDualAudioEngine.setTrackStemMode('b', 'full')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      trackB.stemMode === 'full'
                        ? 'bg-[#06b6d4] text-black border-[#06b6d4] shadow-md shadow-[#06b6d4]/30'
                        : 'bg-[#240c0f] text-[#a67c7f] border-[#371518] hover:text-white'
                    }`}
                  >
                    Full Mix
                  </button>
                  <button
                    onClick={() => globalDualAudioEngine.setTrackStemMode('b', 'beat_only')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      trackB.stemMode === 'beat_only'
                        ? 'bg-[#06b6d4] text-black border-[#06b6d4] shadow-md shadow-[#06b6d4]/30'
                        : 'bg-[#240c0f] text-[#a67c7f] border-[#371518] hover:text-white'
                    }`}
                  >
                    Beat Only (Words Muted)
                  </button>
                  <button
                    onClick={() => globalDualAudioEngine.setTrackStemMode('b', 'words_only')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      trackB.stemMode === 'words_only'
                        ? 'bg-[#06b6d4] text-black border-[#06b6d4] shadow-md shadow-[#06b6d4]/30'
                        : 'bg-[#240c0f] text-[#a67c7f] border-[#371518] hover:text-white'
                    }`}
                  >
                    Words Only (Acapella)
                  </button>
                </div>
              </div>

              {/* Volume & Beat Nudge Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">Song B Volume</span>
                    <span className="font-mono text-[#06b6d4]">{(trackB.volume * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={trackB.volume}
                    onChange={(e) => globalDualAudioEngine.setTrackVolume('b', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#06b6d4] cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">Downbeat Nudge</span>
                    <span className="font-mono text-[#06b6d4]">{trackB.beatOffsetMs > 0 ? `+${trackB.beatOffsetMs}` : trackB.beatOffsetMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="-800"
                    max="800"
                    step="20"
                    value={trackB.beatOffsetMs}
                    onChange={(e) => globalDualAudioEngine.setBeatOffsetMs('b', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#140708] rounded-lg accent-[#06b6d4] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DUAL BEAT COMPRESSION & GLUE MASTER RACK */}
      <div className="p-6 rounded-3xl bg-[#18080a] border border-[#3d161a] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d1013] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#ea3838]" />
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                DUAL BEAT COMPRESSION & GLUE BUS PROCESSOR
              </h3>
              <p className="text-[11px] text-[#8a686b]">
                Punches both rhythm sections and unifies their transients into a cohesive, compressed electronic drop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#ff6b72] px-2.5 py-1 rounded-lg bg-[#270e11] border border-[#44161a]">
              GLUE REDUCTION: {gainReductionDb ? `${gainReductionDb.toFixed(1)} dB` : 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Crossfader Slider */}
          <div className="p-4 rounded-2xl bg-[#210c0e] border border-[#361316] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#ff6b72]" />
                Dual Track Crossfader
              </span>
              <span className="font-mono text-[11px] text-[#ff6b72]">
                {config.crossfader === 0.5 ? '50/50 Balanced' : config.crossfader < 0.5 ? `${Math.round((1 - config.crossfader) * 100)}% Song A` : `${Math.round(config.crossfader * 100)}% Song B`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={config.crossfader}
              onChange={(e) => globalDualAudioEngine.setCrossfader(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#120507] rounded-lg accent-[#ea3838] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono font-bold">
              <span className="text-[#ea3838]">100% SONG A</span>
              <span className="text-white">CENTER BLEND</span>
              <span className="text-[#06b6d4]">100% SONG B</span>
            </div>
          </div>

          {/* 2. Beat Punch Transient Saturation */}
          <div className="p-4 rounded-2xl bg-[#210c0e] border border-[#361316] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Beat Kick & Snare Punch
              </span>
              <span className="font-mono text-[11px] text-amber-400">+{config.beatPunchBoost.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={config.beatPunchBoost}
              onChange={(e) => globalDualAudioEngine.setBeatPunchBoost(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#120507] rounded-lg accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-[#8a686b] block">
              Low-shelf saturation tightens overlapping bass drums
            </span>
          </div>

          {/* 3. Glue Bus Compressor Ratio */}
          <div className="p-4 rounded-2xl bg-[#210c0e] border border-[#361316] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Bus Glue Compressor
              </span>
              <span className="font-mono text-[11px] text-emerald-400">
                {config.glueThreshold} dB / {config.glueRatio}:1
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="-8"
              step="1"
              value={config.glueThreshold}
              onChange={(e) => globalDualAudioEngine.setGlueCompression(parseInt(e.target.value), config.glueRatio)}
              className="w-full h-2 bg-[#120507] rounded-lg accent-emerald-400 cursor-pointer"
            />
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {[2, 4, 8, 12].map((r) => (
                <button
                  key={r}
                  onClick={() => globalDualAudioEngine.setGlueCompression(config.glueThreshold, r)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    config.glueRatio === r
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-[#18080a] text-[#a67c7f] border-[#311215] hover:text-white'
                  }`}
                >
                  {r}:1
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Timeline & Live Progress Bar */}
      <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin text-[#ea3838]' : 'text-[#8a686b]'}`} />
            <span className="font-bold text-white uppercase tracking-wider">
              SYNCHRONIZED DUAL PLAYHEAD
            </span>
          </div>
          <div className="font-mono text-xs text-[#a67c7f]">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration || 60)}</span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.5"
          value={currentTime}
          onChange={(e) => globalDualAudioEngine.seek(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#140608] rounded-lg accent-[#ea3838] cursor-pointer"
        />

        {/* Phase alignment visual cue */}
        <div className="flex items-center justify-between text-[11px] text-[#8a686b] pt-1 border-t border-[#2d1013]">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            {isPlaying ? 'Phase-Locked Beat Grid Active' : 'Ready to Play'}
          </span>
          <span className="font-mono text-[#ff7b82]">
            Target Beat Frequency: {(config.targetBpm / 60).toFixed(3)} Hz ({config.targetBpm} BPM)
          </span>
        </div>
      </div>
    </div>
  );
};
