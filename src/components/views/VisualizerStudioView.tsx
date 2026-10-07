import React, { useState } from 'react';
import { 
  Radio, 
  Sparkles, 
  Download, 
  Maximize2, 
  Layers, 
  Music, 
  Type, 
  Play, 
  Pause,
  Image as ImageIcon
} from 'lucide-react';
import { AudioTrack, TransformationPreset } from '../../types';
import { AudioVisualizerCanvas } from '../AudioVisualizerCanvas';
import { globalAudioEngine } from '../../lib/audioEngine';

interface VisualizerStudioViewProps {
  currentTrack: AudioTrack;
  activePreset: TransformationPreset;
}

export const VisualizerStudioView: React.FC<VisualizerStudioViewProps> = ({
  currentTrack,
  activePreset,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [visualMode, setVisualMode] = useState<'circular' | 'bars' | 'oscilloscope' | 'particles'>('circular');
  const [isPlaying, setIsPlaying] = useState(false);
  const [customBgPrompt, setCustomBgPrompt] = useState('Dark rainy city at 2 AM with red neon glow');
  const [bgMood, setBgMood] = useState<'neon_crimson' | 'cyber_rain' | 'celestial_smoke' | 'analog_retro'>('neon_crimson');
  const [showLyrics, setShowLyrics] = useState(true);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

  // Simulated kinetic lyrics
  const lyricsList = [
    'Driving through the midnight rain...',
    'Your frequency echoes through the dark...',
    'Dilating time in 8D spatial motion...',
    'Cathedral reflections never fade...',
  ];

  React.useEffect(() => {
    const unsub = globalAudioEngine.subscribe(({ isPlaying }) => {
      setIsPlaying(isPlaying);
    });
    return () => {
      unsub();
    };
  }, []);

  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % lyricsList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-[#ea3838]" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              VISUALIZER STUDIO & VIDEO ENGINE
            </h2>
          </div>
          <p className="text-xs text-[#a67c7f]">
            Configure multi-format audio-reactive visuals (16:9 YouTube, 9:16 TikTok/Shorts, 1:1 Square Cover).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isPlaying) {
                globalAudioEngine.pause();
              } else {
                globalAudioEngine.play();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#260e10] hover:bg-[#381417] text-white border border-[#4a1c20] text-xs font-bold transition-all shadow-md active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#ff6b72]" />
                Pause Visualizer
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-[#ff6b72]" />
                Play Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* WORKBENCH: VISUALIZER CANVAS + SETTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The Visualizer Canvas (Cols 7 or 8) */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl flex flex-col items-center justify-center relative min-h-[460px]">
          <AudioVisualizerCanvas
            trackTitle={currentTrack.title}
            artist={currentTrack.artist}
            preset={activePreset}
            aspectRatio={aspectRatio}
            visualMode={visualMode}
            coverUrl={currentTrack.coverUrl}
            className="w-full max-w-2xl"
          />

          {/* Kinetic Lyrics Overlay Preview (Section 27) */}
          {showLyrics && (
            <div className="mt-4 px-6 py-2 rounded-2xl bg-[#17080a]/90 border border-[#3e1618] text-center max-w-md animate-fade-in">
              <span className="text-[10px] uppercase tracking-widest text-[#ff6b72] block font-bold mb-0.5">
                KINETIC LYRICS (SYNCED)
              </span>
              <p className="text-sm font-extrabold text-white tracking-wide">
                &ldquo;{lyricsList[currentLyricIndex]}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Right: Controls & Presets (Cols 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Format / Aspect Ratio Selector (Section 24) */}
          <div className="p-4 rounded-2xl bg-[#1b090b] border border-[#371518] space-y-2.5">
            <span className="text-xs font-bold text-white block">OUTPUT FORMAT & ASPECT RATIO</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '16:9', label: '16:9', desc: 'YouTube / Desktop' },
                { id: '9:16', label: '9:16', desc: 'TikTok / Shorts' },
                { id: '1:1', label: '1:1', desc: 'Instagram / Square' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setAspectRatio(fmt.id as '16:9' | '9:16' | '1:1')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    aspectRatio === fmt.id
                      ? 'bg-[#2f1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                      : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
                  }`}
                >
                  <div className="text-xs font-extrabold">{fmt.label}</div>
                  <div className="text-[9px] mt-0.5 leading-tight">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visualizer Type (Section 23) */}
          <div className="p-4 rounded-2xl bg-[#1b090b] border border-[#371518] space-y-2.5">
            <span className="text-xs font-bold text-white block">VISUALIZER SPECTRUM TYPE</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'circular', label: 'Circular Radial' },
                { id: 'bars', label: 'Frequency Bars' },
                { id: 'oscilloscope', label: 'Fluid Sine Wave' },
                { id: 'particles', label: 'Audio Particles' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setVisualMode(mode.id as 'circular' | 'bars' | 'oscilloscope' | 'particles')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    visualMode === mode.id
                      ? 'bg-[#ea3838] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/30'
                      : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Video Background Prompter (Section 28) */}
          <div className="p-4 rounded-2xl bg-[#1b090b] border border-[#371518] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-[#ea3838]" />
              AI VIDEO BACKGROUND SCENE
            </div>
            <input
              type="text"
              value={customBgPrompt}
              onChange={(e) => setCustomBgPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
              placeholder="Describe scene..."
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'neon_crimson', label: 'Neon Crimson' },
                { id: 'cyber_rain', label: 'Cyber Rain' },
                { id: 'celestial_smoke', label: 'Celestial Embers' },
                { id: 'analog_retro', label: 'Analog VHS' },
              ].map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setBgMood(mood.id as 'neon_crimson' | 'cyber_rain' | 'celestial_smoke' | 'analog_retro')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                    bgMood === mood.id
                      ? 'bg-[#3b1517] border-[#ff6b72] text-[#ff6b72]'
                      : 'bg-[#1e0a0d] border-[#371518] text-[#a67c7f]'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kinetic Lyrics Toggle */}
          <div className="p-4 rounded-2xl bg-[#1b090b] border border-[#371518] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#ea3838]" />
              <div>
                <div className="text-xs font-bold text-white">Kinetic Lyric Typography</div>
                <div className="text-[10px] text-[#8a686b]">Synchronize lyrics with audio drop</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showLyrics}
              onChange={(e) => setShowLyrics(e.target.checked)}
              className="w-4 h-4 accent-[#ea3838] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
