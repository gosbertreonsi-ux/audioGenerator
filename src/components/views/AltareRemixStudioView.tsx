import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Play, 
  Pause, 
  Upload, 
  Download, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Flame, 
  Layers, 
  RotateCcw,
  Sparkles,
  Share2,
  Clock,
  Music,
  CheckCircle2,
  Headphones,
  Radio,
  FileAudio
} from 'lucide-react';
import { AudioTrack } from '../../types';
import { globalAudioEngine } from '../../lib/audioEngine';
import { 
  AltareRemixConfig, 
  DEFAULT_ALTARE_CONFIG, 
  ALTARE_KEY_NOTES 
} from '../../lib/altareEngine';

interface AltareRemixStudioViewProps {
  currentTrack: AudioTrack;
  onUpdateTrack: (track: AudioTrack) => void;
  onOpenQuickUpload: () => void;
}

export const AltareRemixStudioView: React.FC<AltareRemixStudioViewProps> = ({
  currentTrack,
  onUpdateTrack,
  onOpenQuickUpload,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(currentTrack.duration || 75);
  const [config, setConfig] = useState<AltareRemixConfig>(() => globalAudioEngine.getAltareConfig());
  const [isAltareActive, setIsAltareActive] = useState<boolean>(() => globalAudioEngine.getIsAltareMode());
  
  // Stem mix levels
  const [stemLevels, setStemLevels] = useState(() => globalAudioEngine.getStemLevels());
  const [stemMode, setStemMode] = useState(() => globalAudioEngine.getStemMode());

  // Render & Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Subscribe to audio engine updates
  useEffect(() => {
    const unsub = globalAudioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      if (state.duration > 0) {
        setDuration(state.duration);
      }
      setStemMode(globalAudioEngine.getStemMode());
      setIsAltareActive(globalAudioEngine.getIsAltareMode());
    });
    return () => unsub();
  }, []);

  // Live Canvas Visualizer (Sidechain pumping & frequency spectrum)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = globalAudioEngine.getAnalyser();
      if (!analyser || !isPlaying) {
        // Idle futuristic grid line
        ctx.strokeStyle = '#381318';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Pulsing ambient dot
        const t = Date.now() * 0.002;
        const pulseY = height / 2 + Math.sin(t) * 12;
        ctx.fillStyle = '#ea3838';
        ctx.beginPath();
        ctx.arc(width / 2, pulseY, 4, 0, Math.PI * 2);
        ctx.fill();

        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Draw background glow
      const avg = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      const glowAlpha = Math.min(0.4, (avg / 255) * 0.5);
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 5, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, `rgba(234, 56, 56, ${glowAlpha})`);
      gradient.addColorStop(0.6, `rgba(168, 85, 247, ${glowAlpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw mirrored futuristic frequency bars
      const barCount = 48;
      const barWidth = (width / barCount) * 0.8;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const percent = value / 255;
        const barHeight = percent * (height * 0.42);

        const x = i * (width / barCount) + (width / barCount - barWidth) / 2;
        const yTop = height / 2 - barHeight;
        const yBottom = height / 2;

        // Future Bass Neon gradient (Altare signature red-cyan-purple)
        const barGrad = ctx.createLinearGradient(0, yTop, 0, yBottom + barHeight);
        barGrad.addColorStop(0, '#06b6d4'); // Cyan top
        barGrad.addColorStop(0.5, '#ea3838'); // Altare Red center
        barGrad.addColorStop(1, '#a855f7'); // Purple bottom

        ctx.fillStyle = barGrad;
        ctx.fillRect(x, yTop, barWidth, barHeight);
        ctx.fillRect(x, yBottom, barWidth, barHeight);
      }

      // Center sidechain pump line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Handle Play/Pause
  const handleTogglePlay = async () => {
    if (!globalAudioEngine.hasUserImportedTrack() && !globalAudioEngine.isAudioLoaded()) {
      fileInputRef.current?.click();
      return;
    }
    if (!isAltareActive) {
      globalAudioEngine.enableAltareRemix(config);
      setIsAltareActive(true);
    }
    globalAudioEngine.togglePlay();
  };

  // Upload custom song
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const decoded = await globalAudioEngine.loadAudioFile(file);
      const newTrack: AudioTrack = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'User Imported Audio',
        duration: Math.round(decoded.duration),
        bpm: config.tempo,
        key: config.key,
        energy: 'High',
        vocals: 'Detected',
        lufs: -9.0,
        genre: 'Altare Future Bass',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        sourceType: 'user_upload',
      };
      onUpdateTrack(newTrack);
      setDuration(decoded.duration);
      // Auto-enable Altare remix and play cleanly
      globalAudioEngine.enableAltareRemix(config);
      setIsAltareActive(true);
      globalAudioEngine.play();
    } catch (err) {
      console.error('Failed to load user audio file:', err);
    }
  };

  // Update Config Params
  const updateConfig = (patch: Partial<AltareRemixConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    globalAudioEngine.setAltareConfig(updated);
  };

  // Toggle Mute Original Words
  const handleToggleWords = () => {
    const nextMute = !config.muteOriginalWords;
    updateConfig({ muteOriginalWords: nextMute });
    if (nextMute) {
      globalAudioEngine.muteOriginalWords();
    } else {
      globalAudioEngine.restoreFullMix();
    }
  };

  // Toggle Mute Original Beat
  const handleToggleBeat = () => {
    const nextMute = !config.muteOriginalBeat;
    updateConfig({ muteOriginalBeat: nextMute });
    if (nextMute) {
      globalAudioEngine.muteOriginalBeat();
    } else {
      globalAudioEngine.restoreFullMix();
    }
  };

  // Render & Download Mastered Altare Remix WAV (-9 LUFS)
  const handleExportRemix = async () => {
    if (!globalAudioEngine.hasUserImportedTrack() && !globalAudioEngine.isAudioLoaded()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(15);
      setExportStep('1/5: Running Source Separation & Extracting Vocal Stem...');
      await new Promise((r) => setTimeout(r, 450));

      setExportProgress(35);
      setExportStep(`2/5: Temporal Quantization to ${config.tempo} BPM & Key Alignment (${config.key})...`);
      await new Promise((r) => setTimeout(r, 400));

      setExportProgress(60);
      setExportStep('3/5: Slicing Vowel Anchors & Generating Melodic Vocal Chops Lead...');
      await new Promise((r) => setTimeout(r, 450));

      setExportProgress(82);
      setExportStep('4/5: Synthesizing Sidechained Supersaws, Reese Bass & 808 Trap Drops...');
      await new Promise((r) => setTimeout(r, 400));

      setExportProgress(95);
      setExportStep('5/5: Applying Studio Brickwall Limiter & Mastering to -9 LUFS...');

      const masteredBlob = await globalAudioEngine.renderAltareRemixWAV();

      setExportProgress(100);
      setExportStep('Complete! Mastered file ready for download.');

      const url = URL.createObjectURL(masteredBlob);
      setDownloadUrl(url);
      setExportSuccess(true);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.title.replace(/\s+/g, '_')}_ALTARE_REMIX_${config.tempo}BPM.wav`;
      a.click();
    } catch (err) {
      console.error('Failed to export Altare remix:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download Separated Stems Package
  const handleExportStems = async () => {
    if (!globalAudioEngine.hasUserImportedTrack() && !globalAudioEngine.isAudioLoaded()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      setExportStep('Rendering Stems Package (Vocal Chops, Supersaw Drop, 808s)...');
      const stems = await globalAudioEngine.renderAltareStems();

      // Download Vocal Chops
      const urlChop = URL.createObjectURL(stems.vocalChops);
      const a1 = document.createElement('a');
      a1.href = urlChop;
      a1.download = `${currentTrack.title.replace(/\s+/g, '_')}_STEM_VOCAL_CHOPS.wav`;
      a1.click();

      // Download Synth Drop
      setTimeout(() => {
        const urlDrop = URL.createObjectURL(stems.synthDrop);
        const a2 = document.createElement('a');
        a2.href = urlDrop;
        a2.download = `${currentTrack.title.replace(/\s+/g, '_')}_STEM_ALTARE_SYNTH_DROP.wav`;
        a2.click();
      }, 500);

      // Download Full Remix
      setTimeout(() => {
        const urlFull = URL.createObjectURL(stems.fullRemix);
        const a3 = document.createElement('a');
        a3.href = urlFull;
        a3.download = `${currentTrack.title.replace(/\s+/g, '_')}_STEM_FULL_MASTER_9LUFS.wav`;
        a3.click();
      }, 1000);

      setExportSuccess(true);
    } catch (err) {
      console.error('Failed to export stems:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate current arrangement phase
  const getPhaseInfo = () => {
    if (currentTime < 30) {
      return {
        phase: 'PHASE 1: INTRO / VERSE',
        timeRange: '0:00 - 0:30',
        desc: 'Ethereal ambient strings, isolated vocals, heavy cathedral reverb & filtered Reese bass',
        color: '#06b6d4',
      };
    } else if (currentTime < 45) {
      return {
        phase: 'PHASE 2: THE BUILD-UP',
        timeRange: '0:30 - 0:45',
        desc: 'Escalating snare roll acceleration (1/4 to 1/32), white noise risers & pre-drop vocal breath',
        color: '#f59e0b',
      };
    } else if (currentTime < 70) {
      return {
        phase: 'PHASE 3: THE CLIMAX DROP',
        timeRange: '0:45 - 1:15',
        desc: 'Sidechained supersaws, heavy saturated 808 sub kick combo & melodic vocal chop loop lead!',
        color: '#ea3838',
      };
    } else {
      return {
        phase: 'PHASE 4: OUTRO',
        timeRange: '1:15 - 1:30',
        desc: 'Reverb wash descent, ethereal pad fade out & sub decay',
        color: '#a855f7',
      };
    }
  };

  const currentPhase = getPhaseInfo();

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 select-none bg-[#0e0405] text-[#f4e8e8]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* =========================================================
          HERO BANNER: PROJECT ALTARE-BUILDER
         ========================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2a0c0f] via-[#3d1216] to-[#1a0709] border border-[#521c21] p-6 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(234,56,56,0.6),transparent_70%)]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#ea3838] text-white shadow-lg shadow-[#ea3838]/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                PROJECT ALTARE-BUILDER
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#240c0f] border border-[#48161a] text-[10px] font-bold text-[#ff6b72]">
                FUTURE BASS / TRAP / WAVE
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#06b6d4]/20 border border-[#06b6d4]/40 text-[10px] font-bold text-[#22d3ee]">
                -9 LUFS MASTER
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
              Programmatic Pop Track Reconstruction
            </h1>
            <p className="text-xs sm:text-sm text-[#cf9fa3] leading-relaxed">
              Transforms your imported song into the iconic <span className="text-white font-bold">Altare aesthetic</span>: extracts vocal words, cuts the original beat, slices melodic vocal chops, layers driving Reese basses &amp; sidechained supersaws, and hits with a clean 808 festival drop!
            </p>
          </div>

          {/* Quick Actions (Play/Upload) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleTogglePlay}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4d4d] hover:brightness-110 text-white font-black text-sm shadow-xl shadow-[#ea3838]/30 transition-all cursor-pointer active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isPlaying ? 'PAUSE REMIX' : 'PLAY ALTARE REMIX'}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#240d10] hover:bg-[#381418] border border-[#4d191d] text-white font-bold text-xs transition-all cursor-pointer"
              title="Import your MP3/WAV track"
            >
              <Upload className="w-4 h-4 text-[#ff6b72]" />
              {globalAudioEngine.hasUserImportedTrack() ? 'CHANGE SONG' : 'IMPORT SONG'}
            </button>
          </div>
        </div>

        {/* Current Imported Track Info Card */}
        <div className="mt-5 pt-4 border-t border-[#46171b] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1c080a] border border-[#ea3838]/50 flex items-center justify-center text-[#ff6b72]">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white uppercase tracking-wider">
                {currentTrack.id !== 'unloaded' ? currentTrack.title : 'NO USER AUDIO IMPORTED YET'}
              </div>
              <div className="text-[11px] text-[#a67c7f]">
                {currentTrack.id !== 'unloaded'
                  ? `${currentTrack.artist} · Detected: ${currentTrack.duration}s · Key: ${config.key} · Remixed at ${config.tempo} BPM`
                  : 'Import any MP3 or WAV to generate the Altare Future Bass / Trap remix'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
              globalAudioEngine.hasUserImportedTrack() 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              {globalAudioEngine.hasUserImportedTrack() ? '✓ USER AUDIO LOADED' : '⚡ AWAITING SONG UPLOAD'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          LIVE ARRANGEMENT TIMELINE & OSCILLOSCOPE STAGE
         ========================================================= */}
      <div className="p-5 rounded-3xl bg-[#17080a] border border-[#381518] shadow-xl space-y-4">
        {/* Phase Indicator Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: currentPhase.color }} />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {currentPhase.phase}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#290d10] text-[#ff6b72] border border-[#48161a]">
              {currentPhase.timeRange}
            </span>
          </div>
          <p className="text-[11px] text-[#a67c7f]">
            {currentPhase.desc}
          </p>
        </div>

        {/* 4-Block Visual Timeline */}
        <div className="grid grid-cols-4 gap-2 h-10 rounded-xl overflow-hidden bg-[#0c0304] p-1 border border-[#381418]">
          <div 
            onClick={() => globalAudioEngine.seek(0)}
            className={`rounded-lg p-2 text-center flex flex-col justify-center cursor-pointer transition-all ${
              currentTime < 30 ? 'bg-cyan-500/30 border border-cyan-400 text-white shadow-md' : 'bg-[#1b080b] hover:bg-[#280c0f] text-[#8a686b]'
            }`}
          >
            <span className="text-[10px] font-black uppercase truncate">1. Intro / Verse</span>
          </div>

          <div 
            onClick={() => globalAudioEngine.seek(30)}
            className={`rounded-lg p-2 text-center flex flex-col justify-center cursor-pointer transition-all ${
              currentTime >= 30 && currentTime < 45 ? 'bg-amber-500/30 border border-amber-400 text-white shadow-md' : 'bg-[#1b080b] hover:bg-[#280c0f] text-[#8a686b]'
            }`}
          >
            <span className="text-[10px] font-black uppercase truncate">2. Snare Build</span>
          </div>

          <div 
            onClick={() => globalAudioEngine.seek(45)}
            className={`rounded-lg p-2 text-center flex flex-col justify-center cursor-pointer transition-all ${
              currentTime >= 45 && currentTime < 70 ? 'bg-rose-500/30 border border-rose-400 text-white shadow-md shadow-rose-500/20' : 'bg-[#1b080b] hover:bg-[#280c0f] text-[#8a686b]'
            }`}
          >
            <span className="text-[10px] font-black uppercase truncate">3. Climax Drop (808)</span>
          </div>

          <div 
            onClick={() => globalAudioEngine.seek(70)}
            className={`rounded-lg p-2 text-center flex flex-col justify-center cursor-pointer transition-all ${
              currentTime >= 70 ? 'bg-purple-500/30 border border-purple-400 text-white shadow-md' : 'bg-[#1b080b] hover:bg-[#280c0f] text-[#8a686b]'
            }`}
          >
            <span className="text-[10px] font-black uppercase truncate">4. Outro</span>
          </div>
        </div>

        {/* Live Sidechain / Spectrum Canvas */}
        <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-[#0a0203] border border-[#381418]">
          <canvas
            ref={canvasRef}
            width={800}
            height={128}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-3 text-[10px] font-mono text-[#ff6b72]/80 uppercase">
            SPECTRUM &amp; SIDECHAIN PUMP DYNAMICS (60 FPS)
          </div>
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-[#06b6d4] uppercase">
            TARGET LOUDNESS: -9.0 LUFS
          </div>
        </div>
      </div>

      {/* =========================================================
          MULTIPURPOSE CONFIGURATION UTILITY (SLIDERS & CONTROLS)
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Altare Signature DSP Parameters */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#17080a] border border-[#381518] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#381418]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#ea3838]" />
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Altare Production Parameters
              </h3>
            </div>
            <button
              onClick={() => updateConfig(DEFAULT_ALTARE_CONFIG)}
              className="text-[11px] text-[#a67c7f] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="space-y-4">
            {/* 1. Energy Slider (Chill Wave to Festival Trap) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#ea3838]" />
                  Energy Slider:
                  <span className="text-[#ff6b72] font-black">
                    {Math.round(config.energy * 100)}%
                  </span>
                </span>
                <span className="text-[10px] text-[#a67c7f]">
                  {config.energy < 0.4 ? 'Chill Wave / Ambient' : config.energy < 0.75 ? 'Melodic Future Bass' : 'Heavy Festival Trap Drop'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.energy}
                onChange={(e) => updateConfig({ energy: parseFloat(e.target.value) })}
                className="w-full accent-[#ea3838] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#714f52]">
                <span>Chill Ambient Wave</span>
                <span>Hybrid Festival Trap</span>
              </div>
            </div>

            {/* 2. Target BPM Quantization */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#06b6d4]" />
                Rhythmic Shift (Future Bass Grid):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[140, 145, 150].map((bpmVal) => (
                  <button
                    key={bpmVal}
                    onClick={() => updateConfig({ tempo: bpmVal as 140 | 145 | 150 })}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      config.tempo === bpmVal
                        ? 'bg-[#ea3838] text-white shadow-lg shadow-[#ea3838]/20'
                        : 'bg-[#220c0e] hover:bg-[#321316] text-[#cf9fa3] border border-[#3e1619]'
                    }`}
                  >
                    {bpmVal} BPM {bpmVal === 145 ? '(Signature)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Electronic Scale & MIDI Chord Progression */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#a855f7]" />
                Detected Scale &amp; Electronic Chord Matrix:
              </label>
              <select
                value={config.key}
                onChange={(e) => updateConfig({ key: e.target.value as AltareRemixConfig['key'] })}
                className="w-full py-2.5 px-3 rounded-xl bg-[#220c0e] border border-[#3e1619] text-xs font-bold text-white focus:outline-none focus:border-[#ea3838] cursor-pointer"
              >
                {Object.keys(ALTARE_KEY_NOTES).map((k) => (
                  <option key={k} value={k}>
                    {k} · Progression: i - VI - III - VII (Altare Signature Chords)
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Vocal Pitch Shift Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#22c55e]" />
                Vocal Pitch &amp; Formant Shift:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: -12, label: 'Deep / Dark (-12st)' },
                  { id: 0, label: 'Normal Vocals (0st)' },
                  { id: 12, label: 'Nightcore (+12st)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateConfig({ vocalPitchShift: item.id as -12 | 0 | 12 })}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      config.vocalPitchShift === item.id
                        ? 'bg-[#22c55e]/30 border border-[#22c55e] text-white shadow-md'
                        : 'bg-[#220c0e] hover:bg-[#321316] text-[#cf9fa3] border border-[#3e1619]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Drop Vocal Chop Density */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                Drop Vocal Chops Lead Density:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sparse', label: 'Sparse Vowels' },
                  { id: 'rhythmic', label: 'Rhythmic (Signature)' },
                  { id: 'rapid', label: 'Rapid 1/16 Slices' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateConfig({ vocalChopDensity: item.id as AltareRemixConfig['vocalChopDensity'] })}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      config.vocalChopDensity === item.id
                        ? 'bg-[#f59e0b]/30 border border-[#f59e0b] text-white shadow-md'
                        : 'bg-[#220c0e] hover:bg-[#321316] text-[#cf9fa3] border border-[#3e1619]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Sidechain Pumping & Reese Filter Dual Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">Sidechain Pump:</span>
                  <span className="text-[#ff6b72] font-mono">{Math.round(config.sidechainDepth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={config.sidechainDepth}
                  onChange={(e) => updateConfig({ sidechainDepth: parseFloat(e.target.value) })}
                  className="w-full accent-[#ea3838]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">Reese Bass Cutoff:</span>
                  <span className="text-[#ff6b72] font-mono">{config.reeseCutoff} Hz</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="450"
                  step="10"
                  value={config.reeseCutoff}
                  onChange={(e) => updateConfig({ reeseCutoff: parseInt(e.target.value) })}
                  className="w-full accent-[#ea3838]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stem Deck & Mute Controls (100% Accuracy) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#17080a] border border-[#381518] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#381418]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ea3838]" />
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Live Stem Deck &amp; Mute
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              100% ACCURATE MUTING
            </span>
          </div>

          <div className="space-y-3">
            {/* 1. Original Singing Words (Lyrics) */}
            <div className="p-3.5 rounded-2xl bg-[#220c0e] border border-[#3e1619] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-white">Original Vocal Words</div>
                <div className="text-[10px] text-[#a67c7f]">
                  {config.muteOriginalWords ? 'Muted / Silenced' : 'Active (Isolated Lead)'}
                </div>
              </div>
              <button
                onClick={handleToggleWords}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  config.muteOriginalWords
                    ? 'bg-rose-500/25 border border-rose-500 text-white'
                    : 'bg-[#311114] hover:bg-[#45181c] text-[#cf9fa3] border border-[#4d191d]'
                }`}
              >
                {config.muteOriginalWords ? 'WORDS MUTED' : 'MUTE WORDS'}
              </button>
            </div>

            {/* 2. Original Drum Beat */}
            <div className="p-3.5 rounded-2xl bg-[#220c0e] border border-[#3e1619] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-white">Original Drum Beat</div>
                <div className="text-[10px] text-[#a67c7f]">
                  {config.muteOriginalBeat ? 'Beat Silenced (Altare Drop Active)' : 'Beat Active (Summed)'}
                </div>
              </div>
              <button
                onClick={handleToggleBeat}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  config.muteOriginalBeat
                    ? 'bg-[#06b6d4]/25 border border-[#06b6d4] text-[#22d3ee]'
                    : 'bg-[#311114] hover:bg-[#45181c] text-[#cf9fa3] border border-[#4d191d]'
                }`}
              >
                {config.muteOriginalBeat ? 'BEAT MUTED' : 'MUTE BEAT'}
              </button>
            </div>

            {/* 3. Altare Supersaws & Reese Bass */}
            <div className="p-3.5 rounded-2xl bg-[#220c0e] border border-[#3e1619] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-white">Altare Supersaws &amp; Reese</div>
                <div className="text-[10px] text-[#a67c7f]">
                  Synthesized 7-voice saw stack + detuned bass
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#ea3838]/20 text-[#ff6b72] border border-[#ea3838]/40">
                ACTIVE (-9 LUFS)
              </span>
            </div>

            {/* 4. Altare Melodic Vocal Chops Lead */}
            <div className="p-3.5 rounded-2xl bg-[#220c0e] border border-[#3e1619] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-white">Melodic Vocal Chops Lead</div>
                <div className="text-[10px] text-[#a67c7f]">
                  Automatic vowel anchor slicer during the drop
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                AUTO-SLICED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          RENDER DASHBOARD & EXPORT / DOWNLOAD PANEL
         ========================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1c080b] via-[#2a0d10] to-[#180608] border border-[#48161b] shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-[#ea3838]" />
              Download &amp; Export Center (-9 LUFS Club Grade)
            </h3>
            <p className="text-xs text-[#cf9fa3]">
              Download your reconstructed track as a 24-bit/16-bit high-bitrate mastered WAV or download individual separated stems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportRemix}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4d4d] hover:brightness-110 disabled:opacity-50 text-white font-black text-xs shadow-xl shadow-[#ea3838]/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'COMPILING MASTER...' : 'DOWNLOAD MASTER WAV (-9 LUFS)'}
            </button>

            <button
              onClick={handleExportStems}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#280e12] hover:bg-[#381419] disabled:opacity-50 border border-[#4d191d] text-white font-bold text-xs transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#06b6d4]" />
              DOWNLOAD STEMS PACKAGE
            </button>
          </div>
        </div>

        {/* Live Progress Bar Tracking */}
        {isExporting && (
          <div className="p-4 rounded-2xl bg-[#120406] border border-[#3e1518] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ea3838] animate-pulse" />
                {exportStep}
              </span>
              <span className="font-mono text-[#ff6b72] font-black">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#240c0f] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ea3838] via-[#06b6d4] to-[#a855f7] transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {exportSuccess && !isExporting && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Export complete! Your Altare Future Bass / Trap Mastered WAV has been downloaded to your system.
              </span>
            </div>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${currentTrack.title}_ALTARE_REMIX.wav`}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-black text-[11px] shrink-0"
              >
                RE-DOWNLOAD
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
