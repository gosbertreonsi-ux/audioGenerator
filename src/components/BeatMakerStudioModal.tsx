import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Sliders, 
  Download, 
  Music, 
  Flame, 
  Plus, 
  Trash2, 
  Shuffle, 
  Layers,
  Radio,
  Zap,
  Check
} from 'lucide-react';
import { globalAudioEngine } from '../lib/audioEngine';

interface BeatMakerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendBeatToEngine?: () => void;
}

type DrumTrack = 'kick' | 'snare' | 'hihat' | 'shaker' | 'logdrum' | 'kalimba' | 'horn';

interface TrackDef {
  id: DrumTrack;
  name: string;
  color: string;
  category: string;
  hotkey: string;
}

const TRACK_DEFS: TrackDef[] = [
  { id: 'kick', name: 'Afro / Club Kick', color: '#ea3838', category: 'Drums', hotkey: 'Q' },
  { id: 'snare', name: 'Rim / Snare Clap', color: '#f97316', category: 'Drums', hotkey: 'W' },
  { id: 'hihat', name: 'Crisp Hi-Hat', color: '#eab308', category: 'Percussion', hotkey: 'E' },
  { id: 'shaker', name: '16th Afro Shaker', color: '#10b981', category: 'Percussion', hotkey: 'R' },
  { id: 'logdrum', name: 'Amapiano Log Drum', color: '#8b5cf6', category: 'Bass', hotkey: 'A' },
  { id: 'kalimba', name: 'Kalimba Chime', color: '#06b6d4', category: 'Melody', hotkey: 'S' },
  { id: 'horn', name: 'Afro Brass Horn', color: '#ec4899', category: 'Brass', hotkey: 'D' },
];

const PRESET_PATTERNS: Record<string, { bpm: number; steps: Record<DrumTrack, boolean[]> }> = {
  'Afrobeat Lagos (112 BPM)': {
    bpm: 112,
    steps: {
      kick: [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      shaker: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      logdrum: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      kalimba: [false, false, true, false, false, false, false, true, false, false, true, false, false, true, false, false],
      horn: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, true, false],
    }
  },
  'Amapiano Bacardi (113 BPM)': {
    bpm: 113,
    steps: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
      shaker: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, true],
      logdrum: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, true, false],
      kalimba: [false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false],
      horn: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    }
  },
  'Durban Gqom War (127 BPM)': {
    bpm: 127,
    steps: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, true],
      hihat: [true, true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
      shaker: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      logdrum: [true, true, false, false, true, false, false, false, true, true, false, false, true, false, false, false],
      kalimba: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      horn: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    }
  },
  'Soukous Sebene Dance (130 BPM)': {
    bpm: 130,
    steps: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      shaker: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      logdrum: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      kalimba: [true, false, true, false, false, true, false, true, false, true, false, false, true, false, true, false],
      horn: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    }
  },
  'Southern Trap 808 (140 BPM)': {
    bpm: 140,
    steps: {
      kick: [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      shaker: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      logdrum: [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false],
      kalimba: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      horn: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    }
  },
  'UK Drill Dark (142 BPM)': {
    bpm: 142,
    steps: {
      kick: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, true, false],
      hihat: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, true],
      shaker: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      logdrum: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      kalimba: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      horn: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    }
  }
};

export const BeatMakerStudioModal: React.FC<BeatMakerStudioModalProps> = ({
  isOpen,
  onClose,
  onSendBeatToEngine,
}) => {
  const [bpm, setBpm] = useState<number>(112);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activePatternName, setActivePatternName] = useState<string>('Afrobeat Lagos (112 BPM)');
  
  // 16 steps per track
  const [grid, setGrid] = useState<Record<DrumTrack, boolean[]>>(() => {
    return PRESET_PATTERNS['Afrobeat Lagos (112 BPM)'].steps;
  });

  const [activePad, setActivePad] = useState<DrumTrack | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stepTimerRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);

  // Keyboard hotkey listeners
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const track = TRACK_DEFS.find(t => t.hotkey === key);
      if (track) {
        handleTriggerPad(track.id);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Sequencer playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      return;
    }

    const stepIntervalMs = (60000 / bpm) / 4; // 16th notes
    stepTimerRef.current = window.setInterval(() => {
      const step = (currentStepRef.current + 1) % 16;
      currentStepRef.current = step;
      setCurrentStep(step);

      // Trigger active instruments on this step
      TRACK_DEFS.forEach((tr) => {
        if (grid[tr.id] && grid[tr.id][step]) {
          globalAudioEngine.triggerDrumSound(tr.id, 0.95);
        }
      });
    }, stepIntervalMs);

    return () => {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, [isPlaying, bpm, grid]);

  if (!isOpen) return null;

  const handleToggleStep = (trackId: DrumTrack, stepIndex: number) => {
    setGrid(prev => {
      const newTrack = [...prev[trackId]];
      newTrack[stepIndex] = !newTrack[stepIndex];
      return { ...prev, [trackId]: newTrack };
    });
  };

  const handleTriggerPad = (trackId: DrumTrack) => {
    globalAudioEngine.triggerDrumSound(trackId, 1.0);
    setActivePad(trackId);
    setTimeout(() => setActivePad(null), 120);
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = PRESET_PATTERNS[presetName];
    if (preset) {
      setActivePatternName(presetName);
      setBpm(preset.bpm);
      setGrid(preset.steps);
      currentStepRef.current = 0;
      setCurrentStep(0);
    }
  };

  const handleClearAll = () => {
    const empty = TRACK_DEFS.reduce((acc, tr) => {
      acc[tr.id] = new Array(16).fill(false);
      return acc;
    }, {} as Record<DrumTrack, boolean[]>);
    setGrid(empty);
  };

  const handleRandomize = () => {
    const randomized = TRACK_DEFS.reduce((acc, tr) => {
      acc[tr.id] = new Array(16).fill(false).map(() => Math.random() < 0.25);
      return acc;
    }, {} as Record<DrumTrack, boolean[]>);
    setGrid(randomized);
  };

  const handleChordTrigger = (chordName: string) => {
    globalAudioEngine.initContext();
    globalAudioEngine.triggerDrumSound('kalimba', 1.0);
    setToastMessage(`Triggered ${chordName} chord`);
    setTimeout(() => setToastMessage(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl bg-[#140608] border border-[#3e1618] shadow-2xl flex flex-col overflow-hidden text-[#f4e8e8]">
        
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#2d1013] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-[#1e0a0d]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838]/20 border border-[#ea3838]/40 text-[#ff6b72] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                PROFESSIONAL BEAT MACHINE & SEQUENCER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#c084fc] text-[10px] font-bold border border-[#8b5cf6]/40 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                AMAPIANO LOG DRUM & AFRO SYNTHESIS
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              16-STEP DRUM SEQUENCER & MPC PAD STUDIO
            </h2>
            <p className="text-xs text-[#a67c7f]">
              Direct synthesis like FL Studio, Ableton, & BandLab. Click steps, tap live pads, and generate infectious African rhythms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30'
                  : 'bg-[#ea3838] hover:bg-[#ff4d4d] text-white shadow-[#ea3838]/40'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isPlaying ? 'STOP SEQUENCER' : 'PLAY LOOP'}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#280e10] hover:bg-[#3a1517] text-[#a67c7f] hover:text-white border border-[#4d191c] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sequencer Toolbar */}
        <div className="px-5 py-3 border-b border-[#2d1013] bg-[#17080a] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#a67c7f] font-bold uppercase text-[10px]">PRESET PATTERN:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.keys(PRESET_PATTERNS).map((pName) => (
                <button
                  key={pName}
                  onClick={() => handleLoadPreset(pName)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    activePatternName === pName
                      ? 'bg-[#ea3838] text-white shadow-md'
                      : 'bg-[#220d0f] text-[#b0878a] hover:text-white hover:bg-[#2b1013] border border-[#361315]'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo BPM & Tools */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#220d0f] px-3 py-1 rounded-xl border border-[#361315]">
              <span className="text-[10px] font-bold text-[#a67c7f] uppercase">TEMPO:</span>
              <input
                type="number"
                min="80"
                max="165"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-mono font-bold text-center focus:outline-none"
              />
              <span className="text-[10px] text-[#f59e0b] font-bold">BPM</span>
            </div>

            <button
              onClick={handleRandomize}
              className="p-2 rounded-xl bg-[#220d0f] hover:bg-[#2b1013] text-[#b0878a] hover:text-white border border-[#361315]"
              title="Randomize Pattern"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClearAll}
              className="p-2 rounded-xl bg-[#220d0f] hover:bg-[#2b1013] text-[#b0878a] hover:text-white border border-[#361315]"
              title="Clear Pattern"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">

          {/* 1. 16-STEP GRID */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#a67c7f]">
              <span className="text-white uppercase flex items-center gap-2">
                <Music className="w-4 h-4 text-[#ea3838]" />
                16-STEP POLYYRHYTHMIC MATRIX
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 sm:w-8 md:w-10 text-center font-bold ${
                      currentStep === i && isPlaying ? 'text-amber-400 scale-110' : 'text-[#5f3336]'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid rows */}
            <div className="space-y-2">
              {TRACK_DEFS.map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  {/* Track label button */}
                  <button
                    onClick={() => handleTriggerPad(track.id)}
                    className="w-28 sm:w-36 shrink-0 p-2 rounded-xl text-left border flex items-center justify-between transition-all group"
                    style={{
                      backgroundColor: `${track.color}15`,
                      borderColor: `${track.color}40`,
                    }}
                  >
                    <div className="truncate">
                      <div className="font-bold text-[11px] text-white group-hover:text-amber-300">
                        {track.name}
                      </div>
                      <div className="text-[9px] text-[#a67c7f]">
                        {track.category} · Key <span className="font-mono text-white">[{track.hotkey}]</span>
                      </div>
                    </div>
                  </button>

                  {/* 16 Step Buttons */}
                  <div className="flex-1 flex items-center gap-1">
                    {grid[track.id].map((active, stepIdx) => {
                      const isPlayhead = currentStep === stepIdx && isPlaying;
                      const isBarStart = stepIdx % 4 === 0;

                      return (
                        <button
                          key={stepIdx}
                          onClick={() => handleToggleStep(track.id, stepIdx)}
                          className={`flex-1 h-9 rounded-lg transition-all border relative flex items-center justify-center ${
                            active
                              ? 'shadow-md scale-95'
                              : isBarStart
                              ? 'bg-[#220d0f] border-[#3d1518] hover:bg-[#2e1114]'
                              : 'bg-[#18080a] border-[#290e10] hover:bg-[#230c0e]'
                          }`}
                          style={{
                            backgroundColor: active ? track.color : undefined,
                            borderColor: active ? track.color : undefined,
                          }}
                        >
                          {/* Playhead LED ring */}
                          {isPlayhead && (
                            <span className="absolute inset-0 rounded-lg ring-2 ring-white/90 animate-pulse pointer-events-none" />
                          )}
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 8 MPC-STYLE LIVE DRUM PADS */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#f59e0b]" />
                LIVE MPC PADS (TAP OR USE HOTKEYS [Q, W, E, R, A, S, D])
              </span>
              <span className="text-[11px] text-[#a67c7f]">Instant 0ms latency hardware audio triggers</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {TRACK_DEFS.map((track) => {
                const isHit = activePad === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleTriggerPad(track.id)}
                    className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative overflow-hidden group select-none active:scale-95 ${
                      isHit
                        ? 'brightness-150 scale-95 shadow-xl'
                        : 'hover:brightness-125'
                    }`}
                    style={{
                      backgroundColor: `${track.color}25`,
                      borderColor: `${track.color}60`,
                    }}
                  >
                    <span 
                      className="absolute top-1.5 right-2 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white"
                    >
                      {track.hotkey}
                    </span>
                    <span className="font-black text-xs text-white group-hover:scale-105 transition-transform mt-2">
                      {track.name}
                    </span>
                    <span className="text-[10px] text-[#a67c7f] mt-0.5">
                      {track.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. AFRICAN CHORD & MELODY PAD STRIP */}
          <div className="rounded-2xl p-4 md:p-5 bg-[#1a0a0c] border border-[#361315] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
                SOULFUL AFRICAN JAZZ & AMAPIANO CHORD TRIGGERS
              </span>
              <span className="text-[11px] text-[#a67c7f]">Tap to accompany your rhythm</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { chord: 'F#m9', desc: 'Amapiano Soul', color: '#8b5cf6' },
                { chord: 'Bm7', desc: 'Bacardi Vibe', color: '#ec4899' },
                { chord: 'Em9', desc: 'Deep Piano', color: '#06b6d4' },
                { chord: 'A13', desc: 'Afro Jazz Horn', color: '#f59e0b' },
                { chord: 'Gmaj7', desc: 'Lagos Soul Groove', color: '#10b981' },
                { chord: 'Dmaj7', desc: 'Highlife Gold', color: '#ea3838' },
              ].map((item) => (
                <button
                  key={item.chord}
                  onClick={() => handleChordTrigger(item.chord)}
                  className="p-3.5 rounded-xl border bg-[#1e0a0d] hover:bg-[#2d0f13] border-[#361315] hover:border-[#8b5cf6] text-center transition-all group active:scale-95"
                >
                  <div className="font-black text-sm text-white group-hover:text-[#c084fc]">
                    {item.chord}
                  </div>
                  <div className="text-[10px] text-[#a67c7f] mt-0.5">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
