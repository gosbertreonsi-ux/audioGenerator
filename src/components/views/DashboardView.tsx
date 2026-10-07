import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Bookmark, 
  ChevronRight, 
  Sparkles, 
  Disc, 
  Award, 
  Activity, 
  X,
  Volume2
} from 'lucide-react';
import { AudioTrack, TransformationPreset } from '../../types';
import { PRESET_STYLES, SAMPLE_TRACKS } from '../../lib/constants';
import { globalAudioEngine } from '../../lib/audioEngine';
import { NavTab } from '../NavigationDock';

interface DashboardViewProps {
  currentTrack: AudioTrack;
  onSelectTrack: (track: AudioTrack) => void;
  activePreset: TransformationPreset;
  onSelectPreset: (preset: TransformationPreset) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenMakeItAVibe: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentTrack,
  onSelectTrack,
  activePreset,
  onSelectPreset,
  onNavigateTab,
  onOpenMakeItAVibe,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [downloadPaused, setDownloadPaused] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(82);
  const [isSavedBookmark, setIsSavedBookmark] = useState(false);

  // Subscribe to audio engine
  React.useEffect(() => {
    const unsub = globalAudioEngine.subscribe(({ isPlaying }) => {
      setIsPlayingAudio(isPlaying);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleTogglePlay = async () => {
    // If no buffer loaded yet, initialize synthetic demo track
    const audioCtx = globalAudioEngine.getAudioContext();
    if (!audioCtx) {
      await globalAudioEngine.loadSyntheticTrack('midnight_drive');
    }
    globalAudioEngine.togglePlay();
  };

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* =========================================================
          TOP ROW: HERO FEATURED BANNER + 3 QUICK PRESETS LIST
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Hero Featured Banner (Matches the Red Dead Banner in image) */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2c0f12] via-[#3a1317] to-[#1c080a] border border-[#4a1c20] p-6 sm:p-8 flex flex-col justify-between min-h-[300px] shadow-2xl group">
          {/* Subtle fiery glow background & silhouette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(234,56,56,0.35),transparent_65%)] pointer-events-none" />
          
          {/* Hero background artwork overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-3/5 opacity-40 group-hover:opacity-50 transition-opacity pointer-events-none overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
              alt="Atmospheric Wild Horizon"
              className="w-full h-full object-cover object-center filter saturate-150 contrast-125 mix-blend-screen"
            />
          </div>

          {/* Top badges */}
          <div className="relative z-10 flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b080a]/80 backdrop-blur-md border border-[#ea3838]/60 text-xs font-semibold text-[#ff6b72]">
              <Sparkles className="w-3.5 h-3.5 text-[#ea3838]" />
              Featured
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#290d10] border border-[#441619] text-[11px] font-bold text-white tracking-widest">
              M★
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#290d10] border border-[#441619] text-[11px] font-medium text-[#cfa8ab]">
              DSP ENGINE 4K
            </span>
          </div>

          {/* Center Title & Sound descriptor */}
          <div className="relative z-10 my-4 max-w-lg">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md font-sans">
              ULTRA SLOWED
              <span className="block text-[#ff3844] tracking-normal font-extrabold text-2xl sm:text-3xl mt-0.5">
                + REVERB 8D
              </span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#d4abb0] leading-relaxed max-w-md">
              Midnight, 2:00 AM. When time dilates by 32%, sub harmonics tremble, and cathedral reverberation turns every note into an unforgettable atmosphere.
            </p>
          </div>

          {/* Bottom Actions: Reviews pill + Primary CTA */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Reviews pill with avatar stack matching image */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1e0a0d]/85 backdrop-blur-md border border-[#3e1619]">
              <div className="flex -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="Creator"
                  className="w-5 h-5 rounded-full object-cover border border-[#1e0a0d]"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                  alt="Creator"
                  className="w-5 h-5 rounded-full object-cover border border-[#1e0a0d]"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80"
                  alt="Creator"
                  className="w-5 h-5 rounded-full object-cover border border-[#1e0a0d]"
                />
              </div>
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                👍 +48K Creators
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleTogglePlay}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#260e10] hover:bg-[#381417] text-white border border-[#4a1c20] text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#ff6b72]" />
                    Pause Live
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current text-[#ff6b72]" />
                    Hear Live DSP
                  </>
                )}
              </button>

              <button
                onClick={onOpenMakeItAVibe}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] hover:from-[#d62f2f] hover:to-[#ea3838] text-white text-xs font-extrabold shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                MAKE IT A VIBE
              </button>
            </div>
          </div>
        </div>

        {/* Right 3 Quick Presets Cards (Matches the 3 items right of banner in image) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          {PRESET_STYLES.slice(0, 3).map((style) => {
            const isCurrent = activePreset.id === style.id;
            return (
              <div
                key={style.id}
                onClick={() => {
                  onSelectPreset(style);
                  globalAudioEngine.setTransformation(style);
                }}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${
                  isCurrent
                    ? 'bg-[#2e1013] border-[#ea3838] shadow-lg shadow-[#ea3838]/20'
                    : 'bg-[#1b090b] hover:bg-[#250d0f] border-[#371518]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#441619] shrink-0">
                    <img
                      src={
                        style.id === 'ultra_slowed_reverb'
                          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'
                          : style.id === 'spatial_8d'
                          ? 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=200&q=80'
                          : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#ea3838]/20" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {style.name}
                    </h3>
                    <p className="text-[11px] text-[#a67c7f] mt-0.5">
                      {style.badge} · {(style.speed * 100).toFixed(0)}% Speed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPreset(style);
                      globalAudioEngine.setTransformation(style);
                      if (!isPlayingAudio) handleTogglePlay();
                    }}
                    className="p-1.5 rounded-lg bg-[#260e10] hover:bg-[#ea3838] text-[#c59c9f] hover:text-white transition-colors"
                    title="Audition preset"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#8a686b]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          MIDDLE ROW: LATEST ACTIVITIES (3 CARDS) + YOUR STATISTICS
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Latest Activities (Cols 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-wide">
              Latest Activities
            </h3>
            <button
              onClick={() => onNavigateTab('studio')}
              className="text-xs font-semibold text-[#a67c7f] hover:text-[#ff6b72] transition-colors"
            >
              See More →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Activity Card 1 (Matches A Quiet Time with play button) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1c0a0c] border border-[#371518] group flex flex-col justify-between p-3.5 min-h-[170px] shadow-md">
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80"
                  alt="A Quiet Time"
                  className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140708] via-[#140708]/60 to-transparent" />
              </div>

              {/* Top controls in card */}
              <div className="relative z-10 flex items-center justify-between">
                <button
                  onClick={handleTogglePlay}
                  className="w-8 h-8 rounded-full bg-[#ea3838] hover:bg-[#ff4d4d] text-white flex items-center justify-center shadow-lg shadow-[#ea3838]/40 transition-transform active:scale-90"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsSavedBookmark(!isSavedBookmark)}
                  className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                    isSavedBookmark ? 'bg-[#ea3838] text-white' : 'bg-[#1b080a]/60 text-[#c59c9f] hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Info */}
              <div className="relative z-10 pt-4">
                <h4 className="text-sm font-bold text-white leading-snug">
                  A Quiet Time
                </h4>
                <p className="text-[11px] text-[#ff6b72] mt-0.5">
                  Ultra Slowed Mastered
                </p>
                <span className="text-[10px] text-[#8a686b] mt-1 block">
                  2 hours ago
                </span>
              </div>
            </div>

            {/* Activity Card 2 (Matches Sharpshooter / 80% accuracy) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1c0a0c] border border-[#371518] group flex flex-col justify-between p-3.5 min-h-[170px] shadow-md">
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80"
                  alt="Sharpshooter"
                  className="w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140708] via-[#140708]/60 to-transparent" />
              </div>

              <div className="relative z-10 flex justify-end">
                <span className="px-2 py-0.5 rounded-md bg-[#2d1013] border border-[#441619] text-[10px] text-[#ff6b72] font-semibold">
                  360° 8D
                </span>
              </div>

              <div className="relative z-10 pt-4">
                <h4 className="text-sm font-bold text-white leading-snug">
                  Spatial Master
                </h4>
                <p className="text-[11px] text-[#d6a5a8] mt-0.5">
                  Binaural headphone sweep
                </p>
                <span className="text-[10px] text-[#8a686b] mt-1 block">
                  3 hours ago
                </span>
              </div>
            </div>

            {/* Activity Card 3 (Matches 100% Game Completion) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1c0a0c] border border-[#371518] group flex flex-col justify-between p-3.5 min-h-[170px] shadow-md">
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80"
                  alt="Completion"
                  className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140708] via-[#140708]/60 to-transparent" />
              </div>

              {/* 100% Circular badge */}
              <div className="relative z-10 flex justify-center pt-2">
                <div className="w-11 h-11 rounded-full border-2 border-[#ea3838] bg-[#290d10] flex items-center justify-center text-xs font-black text-white shadow-md shadow-[#ea3838]/30">
                  100%
                </div>
              </div>

              <div className="relative z-10 pt-2 text-center">
                <h4 className="text-sm font-bold text-white leading-snug">
                  Content Pack Complete
                </h4>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  YouTube & Shorts ready
                </p>
                <span className="text-[10px] text-[#8a686b] mt-1 block">
                  2 days ago
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Your Statistics (Matches the circular ring progress & 3 bottom stats in image) */}
        <div className="lg:col-span-4 rounded-3xl bg-[#1b090b] border border-[#371518] p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white tracking-wide">
              Your Statistics
            </h3>
            <button
              onClick={() => onNavigateTab('trends')}
              className="text-xs font-semibold text-[#a67c7f] hover:text-[#ff6b72] transition-colors"
            >
              →
            </button>
          </div>

          {/* Large Circular Gauge SVG */}
          <div className="relative flex flex-col items-center justify-center py-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#2d1013"
                  strokeWidth="8"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#ea3838"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset="65"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Playtime text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-medium text-[#a67c7f]">
                  Total Processed
                </span>
                <span className="text-2xl font-black text-white tracking-tight mt-0.5">
                  128,45h
                </span>
              </div>
            </div>
          </div>

          {/* 3 Bottom Stat Metrics matching Hat, Star, Skull */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2d1013]">
            {/* Metric 1 (Cowboy Hat / Vinyl Disk) */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#290d10] border border-[#441619] flex items-center justify-center text-[#ff6b72] mb-1">
                <Disc className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white">92%</span>
              <span className="text-[10px] text-[#a67c7f] leading-tight">Vibe Score</span>
            </div>

            {/* Metric 2 (Star / Challenge) */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#290d10] border border-[#441619] flex items-center justify-center text-[#ff6b72] mb-1">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white">189</span>
              <span className="text-[10px] text-[#a67c7f] leading-tight">Content Packs</span>
            </div>

            {/* Metric 3 (Skull / Audience Reach) */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-[#290d10] border border-[#441619] flex items-center justify-center text-[#ff6b72] mb-1">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white">7,243</span>
              <span className="text-[10px] text-[#a67c7f] leading-tight">Audience Reach</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          BOTTOM ROW: LAST DOWNLOADS (Matches image bottom bar)
         ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-wide">
            Last Downloads & Render Queue
          </h3>
          <button
            onClick={() => onNavigateTab('publish')}
            className="text-xs font-semibold text-[#a67c7f] hover:text-[#ff6b72] transition-colors"
          >
            See More →
          </button>
        </div>

        {/* Progress Card matching image bottom left bar */}
        <div className="rounded-2xl bg-[#1b090b] border border-[#371518] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Artwork thumbnail with Red Dead style mark */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#441619] shrink-0">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#ea3838]/25" />
            </div>

            {/* Title & metadata */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  {currentTrack.title}
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ea3838] text-white">
                  MASTER
                </span>
              </div>
              <p className="text-xs text-[#a67c7f]">
                {activePreset.name} (Full Content Package)
              </p>

              {/* Progress bar and counter */}
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#ff6b72]">
                  92.4 MB / 112 MB
                </span>
                <span className="text-[10px] text-[#8a686b]">
                  {downloadPaused ? 'Paused' : '1 hour 24 min. left'}
                </span>
              </div>
              <div className="mt-1 w-64 max-w-full h-1.5 rounded-full bg-[#2d1013] overflow-hidden">
                <div
                  className="h-full bg-[#ea3838] transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons (Pause/Play + Cancel X) */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => {
                setDownloadPaused(!downloadPaused);
                if (!downloadPaused) {
                  setDownloadProgress(82);
                }
              }}
              className="p-2.5 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-white border border-[#441619] transition-all active:scale-95"
              title={downloadPaused ? 'Resume render' : 'Pause render'}
            >
              {downloadPaused ? (
                <Play className="w-4 h-4 fill-current text-[#ff6b72]" />
              ) : (
                <Pause className="w-4 h-4 text-[#ff6b72]" />
              )}
            </button>

            <button
              onClick={() => setDownloadProgress(0)}
              className="p-2.5 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-[#a67c7f] hover:text-white border border-[#441619] transition-all active:scale-95"
              title="Cancel Job"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Track Switcher Pills */}
      <div className="pt-2">
        <span className="text-xs font-semibold text-[#8a686b] block mb-2">
          LOAD PRODUCTION STEM / TRACK:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TRACKS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelectTrack(t);
                // Also trigger synthetic track load matching genre
                if (t.genre.includes('Trap')) {
                  globalAudioEngine.loadSyntheticTrack('cyber_trap');
                } else if (t.genre.includes('Lo-Fi')) {
                  globalAudioEngine.loadSyntheticTrack('lofi_rain');
                } else {
                  globalAudioEngine.loadSyntheticTrack('midnight_drive');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                currentTrack.id === t.id
                  ? 'bg-[#ea3838] text-white border-[#ea3838] shadow-md shadow-[#ea3838]/30 font-bold'
                  : 'bg-[#1e0a0d] text-[#c59c9f] hover:text-white border-[#371518]'
              }`}
            >
              {t.title} ({t.key} · {t.bpm} BPM)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
