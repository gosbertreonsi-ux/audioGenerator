import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Mic, 
  Music, 
  Repeat, 
  Flame, 
  Sliders, 
  Check, 
  Radio, 
  Layers,
  ArrowRightLeft,
  Headphones,
  Zap,
  Globe
} from 'lucide-react';
import { AudioTrack, TransformationPreset, StemMode, StemMixLevels } from '../types';
import { INSTRUMENTAL_SWAP_OPTIONS } from '../lib/constants';
import { globalAudioEngine } from '../lib/audioEngine';

interface InstrumentalSwapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: AudioTrack;
  onSelectTrack: (track: AudioTrack) => void;
  onApplyPreset: (preset: TransformationPreset) => void;
  onOpenVideoStudio?: () => void;
}

export const InstrumentalSwapperModal: React.FC<InstrumentalSwapperModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  onSelectTrack,
  onApplyPreset,
  onOpenVideoStudio,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stemMode, setStemMode] = useState<StemMode>(globalAudioEngine.getStemMode());
  const [selectedStyle, setSelectedStyle] = useState<string>(globalAudioEngine.getSwappedInstrumental() || 'afrobeat_lagos');
  const [vocalLevel, setVocalLevel] = useState<number>(100);
  const [beatLevel, setBeatLevel] = useState<number>(0);
  const [swapLevel, setSwapLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = globalAudioEngine.subscribe(({ isPlaying: p }) => {
      setIsPlaying(p);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handlePlayToggle = () => {
    globalAudioEngine.togglePlay();
  };

  const handleApplyStemMode = (mode: StemMode) => {
    setStemMode(mode);
    globalAudioEngine.setStemMode(mode);
    if (mode === 'words_only') {
      setVocalLevel(110);
      setBeatLevel(0);
      setSwapLevel(0);
      globalAudioEngine.setStemLevels({ vocals: 1.1, beat: 0.0, swappedInstrumental: 0.0 });
    } else if (mode === 'words_muted') {
      setVocalLevel(0);
      setBeatLevel(100);
      setSwapLevel(0);
      globalAudioEngine.muteOriginalWords();
    } else if (mode === 'beat_only') {
      setVocalLevel(0);
      setBeatLevel(100);
      setSwapLevel(0);
      globalAudioEngine.setStemLevels({ vocals: 0.0, beat: 1.0, swappedInstrumental: 0.0 });
    } else if (mode === 'swapped_instrumental') {
      setVocalLevel(100);
      setBeatLevel(0);
      setSwapLevel(105);
      globalAudioEngine.setStemLevels({ vocals: 1.0, beat: 0.0, swappedInstrumental: 1.05 });
      globalAudioEngine.setSwappedInstrumental(selectedStyle);
    } else {
      setVocalLevel(100);
      setBeatLevel(100);
      setSwapLevel(0);
      globalAudioEngine.setStemLevels({ vocals: 1.0, beat: 1.0, swappedInstrumental: 0.0 });
    }
  };

  const handleSelectInstrumental = (styleId: string) => {
    setSelectedStyle(styleId);
    setStemMode('swapped_instrumental');
    globalAudioEngine.setSwappedInstrumental(styleId);
    globalAudioEngine.setStemMode('swapped_instrumental');
    globalAudioEngine.setStemLevels({ vocals: vocalLevel / 100, beat: 0, swappedInstrumental: swapLevel / 100 });
    if (!isPlaying) {
      globalAudioEngine.play();
    }
  };

  // Quick Style Shifter & Muter (Afrobeat, Southern Trap, Amapiano)
  const handleQuickStyleShift = async (styleId: string) => {
    setSelectedStyle(styleId);
    setStemMode('swapped_instrumental');
    setVocalLevel(100);
    setBeatLevel(0); // mute original beat!
    setSwapLevel(110); // apply high-energy style!
    
    globalAudioEngine.setStemLevels({ vocals: 1.0, beat: 0, swappedInstrumental: 1.1 });
    globalAudioEngine.setSwappedInstrumental(styleId);
    globalAudioEngine.play();
  };

  const handleVocalLevelChange = (val: number) => {
    setVocalLevel(val);
    globalAudioEngine.setStemLevels({ vocals: val / 100 });
  };

  const handleBeatLevelChange = (val: number) => {
    setBeatLevel(val);
    globalAudioEngine.setStemLevels({ beat: val / 100 });
  };

  const handleSwapLevelChange = (val: number) => {
    setSwapLevel(val);
    globalAudioEngine.setStemLevels({ swappedInstrumental: val / 100 });
  };

  // Export Remixed Audio
  const handleExportRemix = async (type: 'swapped_remix' | 'vocals' | 'instrumental') => {
    try {
      setIsExporting(true);
      const blob = await globalAudioEngine.renderAndExportWAV({ 
        stemType: type,
        instrumentalStyle: selectedStyle 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = type === 'vocals' ? 'WORDS_ONLY_ACAPELLA' : type === 'instrumental' ? 'AFRO_INSTRUMENTAL' : 'AFROBEAT_REMIX';
      a.download = `${currentTrack.title.replace(/\s+/g, '_')}_${suffix}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(suffix);
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl bg-[#140608] border border-[#3e1618] shadow-2xl flex flex-col overflow-hidden text-[#f4e8e8]">
        
        {/* Top Header */}
        <div className="p-5 md:p-6 border-b border-[#2d1013] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-[#1e0a0d]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#fbbf24] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />
                AFRICAN GENRE REMIXER & STEM SWAPPER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                <Mic className="w-3 h-3" />
                ACAPELLA WORDS ISOLATOR
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              INSTRUMENTAL REPLACER & BEAT REMIX ENGINE
            </h2>
            <p className="text-xs text-[#a67c7f]">
              Isolate vocal words only, mute the original beat, and swap underlying instrumentals to authentic Afrobeat, Amapiano, Gqom, or Soukous.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayToggle}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30'
                  : 'bg-[#ea3838] hover:bg-[#ff4d4d] text-white shadow-[#ea3838]/40'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isPlaying ? 'PAUSE PREVIEW' : 'PLAY REMIX'}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#280e10] hover:bg-[#3a1517] text-[#a67c7f] hover:text-white border border-[#4d191c] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">

          {/* 1. PRO MUSIC STYLE SHIFTER & STEM SUITE */}
          <div className="relative rounded-2xl p-5 md:p-6 bg-gradient-to-r from-[#200d07] via-[#2d1110] to-[#140608] border border-[#f59e0b]/40 shadow-xl overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-[#f59e0b] text-black text-[10px] font-black uppercase tracking-wider">
                    PRO MUSIC STYLE SHIFTER
                  </span>
                  <span className="text-xs font-mono text-[#fcd34d]">Change Instrumental • Mute Words or Beat • All Models</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white">
                  Instantly Transform Songs & Mute Words or Beats
                </h3>
                <p className="text-xs text-[#e6bca0] leading-relaxed">
                  Extract original human singing words with beat muted, or mute original lyrics for a clean instrumental, then swap into authentic 112 BPM Afrobeat, 140 BPM Southern Trap 808s, or Amapiano log drums!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleQuickStyleShift('afrobeat_lagos')}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#ea580c] hover:from-[#fbbf24] hover:to-[#f97316] text-black font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  Afrobeat Lagos
                </button>
                <button
                  onClick={() => handleQuickStyleShift('southern_trap')}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                >
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  Southern Trap 808
                </button>
                <button
                  onClick={() => handleQuickStyleShift('amapiano_logdrum')}
                  className="px-3.5 py-2.5 rounded-xl bg-[#220d0f] hover:bg-[#341315] border border-[#f59e0b]/50 text-[#f59e0b] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  Amapiano Bacardi
                </button>
                {onOpenVideoStudio && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVideoStudio();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Open in VIZMOTION Video
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. STEM MODE SELECTOR (WORDS ONLY / WORDS MUTED / SWAPPED / BEAT ONLY / FULL) */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ea3838]" />
                VOCAL & STEM ISOLATION MODE
              </span>
              <span className="text-[11px] text-[#a67c7f]">
                Active: <span className="text-white font-mono uppercase">{stemMode.replace('_', ' ')}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                onClick={() => handleApplyStemMode('words_muted')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  stemMode === 'words_muted'
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]'
                    : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white hover:bg-[#2b1013]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Mic className="w-4 h-4 text-rose-400 line-through" />
                  {stemMode === 'words_muted' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <div className="font-bold text-xs text-white">Mute Words</div>
                <div className="text-[10px] text-rose-300/80 mt-0.5">Karaoke Instrumental</div>
              </button>

              <button
                onClick={() => handleApplyStemMode('words_only')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  stemMode === 'words_only'
                    ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-white shadow-lg shadow-[#06b6d4]/20 scale-[1.02]'
                    : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white hover:bg-[#2b1013]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Mic className="w-4 h-4 text-[#06b6d4]" />
                  {stemMode === 'words_only' && <Check className="w-3.5 h-3.5 text-[#06b6d4]" />}
                </div>
                <div className="font-bold text-xs text-white">Mute Beat</div>
                <div className="text-[10px] text-[#06b6d4]/80 mt-0.5">Pure Acapella Words</div>
              </button>

              <button
                onClick={() => handleApplyStemMode('swapped_instrumental')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  stemMode === 'swapped_instrumental'
                    ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/20 scale-[1.02]'
                    : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white hover:bg-[#2b1013]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-[#f59e0b]" />
                  {stemMode === 'swapped_instrumental' && <Check className="w-3.5 h-3.5 text-[#f59e0b]" />}
                </div>
                <div className="font-bold text-xs text-white">Swapped Style</div>
                <div className="text-[10px] text-[#f59e0b]/80 mt-0.5">African / Trap Backing</div>
              </button>

              <button
                onClick={() => handleApplyStemMode('beat_only')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  stemMode === 'beat_only'
                    ? 'bg-[#a855f7]/20 border-[#a855f7] text-white shadow-lg shadow-[#a855f7]/20 scale-[1.02]'
                    : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white hover:bg-[#2b1013]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Music className="w-4 h-4 text-[#a855f7]" />
                  {stemMode === 'beat_only' && <Check className="w-3.5 h-3.5 text-[#a855f7]" />}
                </div>
                <div className="font-bold text-xs text-white">Original Beat</div>
                <div className="text-[10px] text-[#a855f7]/80 mt-0.5">Play Beat, Mute Vocals</div>
              </button>

              <button
                onClick={() => handleApplyStemMode('full')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  stemMode === 'full'
                    ? 'bg-[#ea3838]/20 border-[#ea3838] text-white shadow-lg shadow-[#ea3838]/20 scale-[1.02]'
                    : 'bg-[#220d0f] border-[#361315] text-[#b0878a] hover:text-white hover:bg-[#2b1013]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Sliders className="w-4 h-4 text-[#ea3838]" />
                  {stemMode === 'full' && <Check className="w-3.5 h-3.5 text-[#ea3838]" />}
                </div>
                <div className="font-bold text-xs text-white">Full Mix</div>
                <div className="text-[10px] text-[#ea3838]/80 mt-0.5">Original Master Audio</div>
              </button>
            </div>
          </div>

          {/* 3. REAL-TIME STEM MIXER FADERS */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f59e0b]" />
              REAL-TIME STEM BALANCE & FADERS
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vocal Words Fader */}
              <div className="p-3.5 rounded-xl bg-[#220d0f] border border-[#3a1517] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#06b6d4]" />
                    Vocal Words (Acapella)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#06b6d4]">{vocalLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={vocalLevel}
                  onChange={(e) => handleVocalLevelChange(Number(e.target.value))}
                  className="w-full accent-[#06b6d4] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#a67c7f]">
                  <button onClick={() => handleVocalLevelChange(0)} className="hover:text-white">Mute</button>
                  <button onClick={() => handleVocalLevelChange(100)} className="hover:text-white">Default</button>
                  <button onClick={() => handleVocalLevelChange(140)} className="hover:text-white">Solo (+3dB)</button>
                </div>
              </div>

              {/* Original Track Beat Fader */}
              <div className="p-3.5 rounded-xl bg-[#220d0f] border border-[#3a1517] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#ea3838]" />
                    Original Track Beat
                  </span>
                  <span className="text-xs font-mono font-bold text-[#ea3838]">{beatLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={beatLevel}
                  onChange={(e) => handleBeatLevelChange(Number(e.target.value))}
                  className="w-full accent-[#ea3838] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#a67c7f]">
                  <button onClick={() => handleBeatLevelChange(0)} className="hover:text-white">Mute Beat</button>
                  <button onClick={() => handleBeatLevelChange(100)} className="hover:text-white">Default</button>
                  <button onClick={() => handleBeatLevelChange(130)} className="hover:text-white">Loud</button>
                </div>
              </div>

              {/* Swapped Instrumental Fader */}
              <div className="p-3.5 rounded-xl bg-[#220d0f] border border-[#3a1517] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[#f59e0b]" />
                    Swapped African Beat
                  </span>
                  <span className="text-xs font-mono font-bold text-[#f59e0b]">{swapLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={swapLevel}
                  onChange={(e) => handleSwapLevelChange(Number(e.target.value))}
                  className="w-full accent-[#f59e0b] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#a67c7f]">
                  <button onClick={() => handleSwapLevelChange(0)} className="hover:text-white">Off</button>
                  <button onClick={() => handleSwapLevelChange(100)} className="hover:text-white">Balanced</button>
                  <button onClick={() => handleSwapLevelChange(130)} className="hover:text-white">Boost</button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. CHOOSE SWAPPED AFRICAN INSTRUMENTAL GROOVE */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#f59e0b]" />
                SELECT NEW BACKING INSTRUMENTAL (AFRICAN SUITE)
              </span>
              <span className="text-[11px] text-[#a67c7f]">Click to swap and audition live</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INSTRUMENTAL_SWAP_OPTIONS.map((opt) => {
                const isSelected = selectedStyle === opt.id && stemMode === 'swapped_instrumental';
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectInstrumental(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-[#2a1309] border-[#f59e0b] shadow-xl shadow-[#f59e0b]/20 scale-[1.02]'
                        : 'bg-[#1e0a0d] border-[#361315] hover:bg-[#280e11] hover:border-[#4d191c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/40 text-white border border-white/10">
                          {opt.badge}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#f59e0b]">
                          {opt.bpm} BPM
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-white group-hover:text-[#f59e0b] transition-colors">
                        {opt.name}
                      </h4>
                      <p className="text-[11px] text-[#a67c7f] line-clamp-2 mt-1">
                        {opt.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#311315] flex items-center justify-between text-[10px] text-[#b0878a]">
                      <span className="truncate max-w-[170px]">{opt.instruments.slice(0, 3).join(', ')}</span>
                      {isSelected ? (
                        <span className="text-[#f59e0b] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="text-white/60 group-hover:text-white font-semibold">
                          SWAP BEAT →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. DOWNLOAD & EXPORT SECTION */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#ea3838]" />
              EXPORT REMIXED AUDIO & STEMS
            </span>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                Successfully exported {downloadSuccess} WAV! Check your downloads folder.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleExportRemix('swapped_remix')}
                disabled={isExporting}
                className="py-3 px-4 rounded-xl bg-[#ea3838] hover:bg-[#ff4d4d] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#ea3838]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'EXPORTING...' : 'DOWNLOAD FULL REMIX WAV'}
              </button>

              <button
                onClick={() => handleExportRemix('vocals')}
                disabled={isExporting}
                className="py-3 px-4 rounded-xl bg-[#280e10] hover:bg-[#3d1518] border border-[#4d191c] text-[#06b6d4] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                DOWNLOAD WORDS ONLY (ACAPELLA)
              </button>

              <button
                onClick={() => handleExportRemix('instrumental')}
                disabled={isExporting}
                className="py-3 px-4 rounded-xl bg-[#280e10] hover:bg-[#3d1518] border border-[#4d191c] text-[#f59e0b] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Music className="w-4 h-4" />
                DOWNLOAD AFRO INSTRUMENTAL STEM
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
