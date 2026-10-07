import React from 'react';
import { 
  TrendingUp, 
  Flame, 
  Users, 
  BarChart3, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  Award 
} from 'lucide-react';
import { TransformationPreset } from '../../types';
import { PRESET_STYLES } from '../../lib/constants';

interface TrendDiscoveryViewProps {
  onSelectPreset: (preset: TransformationPreset) => void;
  onOpenMakeItAVibe: () => void;
}

export const TrendDiscoveryView: React.FC<TrendDiscoveryViewProps> = ({
  onSelectPreset,
  onOpenMakeItAVibe,
}) => {
  const trendDatabase = [
    {
      styleId: 'ultra_slowed_reverb',
      name: 'Ultra Slowed + Reverb',
      growth: '+82%',
      creatorCount: '24,800',
      engagement: '94% Retention',
      badge: 'VIRAL #1',
      bestGenre: 'Melodic / Vocal Synth',
    },
    {
      styleId: 'spatial_8d',
      name: '8D Spatial Audio',
      growth: '+43%',
      creatorCount: '16,200',
      engagement: '91% Headphone Listeners',
      badge: 'GROWING FAST',
      bestGenre: 'Hip-Hop / Electronic',
    },
    {
      styleId: 'nightcore',
      name: 'Nightcore Sparkle',
      growth: '+18%',
      creatorCount: '12,900',
      engagement: '88% TikTok Saves',
      badge: 'SHORT-FORM PEAK',
      bestGenre: 'Pop / EDM / Anime',
    },
    {
      styleId: 'night_drive',
      name: 'Night Drive (3AM)',
      growth: '+35%',
      creatorCount: '9,400',
      engagement: '96% Watch Time',
      badge: 'LONG-FORM FAV',
      bestGenre: 'Ambient / Lo-Fi / Trap',
    },
    {
      styleId: 'lofi_nostalgia',
      name: 'Lo-Fi Cassette Nostalgia',
      growth: '+4%',
      creatorCount: '18,500',
      engagement: '84% Study Playlists',
      badge: 'EVERGREEN',
      bestGenre: 'Chill / Acoustic',
    },
    {
      styleId: 'heavy_bass_boost',
      name: 'Sub Bass Boost (808)',
      growth: '+27%',
      creatorCount: '11,100',
      engagement: '89% Car Stereo Edits',
      badge: 'CLUB TREND',
      bestGenre: 'Phonk / Dark Trap',
    },
  ];

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#ea3838]" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              TREND DISCOVERY & AI CONTENT STRATEGIST
            </h2>
          </div>
          <p className="text-xs text-[#a67c7f]">
            Real-time viral audio styles database, audience growth trajectory, and algorithmic recommendations.
          </p>
        </div>

        <button
          onClick={onOpenMakeItAVibe}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] text-white text-xs font-extrabold shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Test Viral Recommendation
        </button>
      </div>

      {/* AI CONTENT STRATEGIST ADVICE (Section 35 & 38) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#1f0b0d] border border-[#3e1618] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#ea3838] uppercase">YOUR BEST STYLE</span>
            <Award className="w-4 h-4 text-[#ea3838]" />
          </div>
          <h3 className="text-base font-bold text-white">Ultra Slowed + Reverb</h3>
          <p className="text-xs text-[#d6a5a8]">
            Your channel earns an average of <strong>42,000 views</strong> on Slowed versions vs 14,000 on standard uploads.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#1f0b0d] border border-[#3e1618] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">NEXT EXPERIMENT</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">360° 8D Spatial Headphones</h3>
          <p className="text-xs text-[#d6a5a8]">
            Spatial headphone content is seeing a <strong>+43% spike</strong> in average session duration. Pair with circular visualizer.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#1f0b0d] border border-[#3e1618] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase">RETENTION DROP FIX</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-white">Trim 0:00 - 0:12 Intro</h3>
          <p className="text-xs text-[#d6a5a8]">
            Audience drops 18% during slow silent builds. Lead directly into the pitched vocal phrase at second 0:04.
          </p>
        </div>
      </div>

      {/* STYLE TREND DATABASE (Section 34) */}
      <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ea3838]" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              GLOBAL STYLE TREND DATABASE
            </h3>
          </div>
          <span className="text-xs text-[#a67c7f]">
            Updated hourly from streaming & short-form data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendDatabase.map((item) => {
            const preset = PRESET_STYLES.find((p) => p.id === item.styleId);
            return (
              <div
                key={item.styleId}
                className="p-4 rounded-2xl bg-[#220d0f] border border-[#371518] hover:border-[#ea3838] transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-[#2d1013] text-[10px] text-[#ff6b72] font-extrabold border border-[#441619]">
                      {item.badge}
                    </span>
                    <span className="text-sm font-black text-emerald-400 flex items-center">
                      {item.growth} <ArrowUpRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2 group-hover:text-[#ff6b72] transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#a67c7f] mt-1">
                    Optimal with: <span className="text-[#d6a5a8]">{item.bestGenre}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-[#311315] flex items-center justify-between text-xs text-[#b0878a]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#ea3838]" />
                    <span>{item.creatorCount} creators</span>
                  </div>
                  <button
                    onClick={() => {
                      if (preset) onSelectPreset(preset);
                    }}
                    className="text-xs font-bold text-[#ff6b72] hover:text-white"
                  >
                    Apply Preset →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
