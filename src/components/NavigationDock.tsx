import React from 'react';
import { 
  Home, 
  Sliders, 
  Sparkles, 
  Video, 
  ShieldCheck, 
  TrendingUp, 
  Send, 
  Plus,
  Mic2,
  ArrowRightLeft,
  Zap,
  Film,
  Layers,
  Wrench,
  Type
} from 'lucide-react';

export type NavTab = 
  | 'utilities'
  | 'vizmotion'
  | 'lyricsync'
  | 'studio'
  | 'dualsync'
  | 'visuals'
  | 'dashboard'
  | 'vibe'
  | 'trends'
  | 'rights'
  | 'publish';

interface NavigationDockProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickUpload: () => void;
  onOpenVocalModels?: () => void;
  onOpenInstrumentalSwapper?: () => void;
  onOpenBeatMaker?: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickUpload,
  onOpenVocalModels,
  onOpenInstrumentalSwapper,
  onOpenBeatMaker,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'utilities', label: 'Mizizi Utilities (123apps Suite)', icon: Wrench, badge: 'A' },
    { id: 'vizmotion', label: 'Creative Studio Video NLE', icon: Film, badge: 'B' },
    { id: 'lyricsync', label: 'Lyric & Music Alignment Studio', icon: Type },
    { id: 'studio', label: 'Studio Engine & Remix DAW', icon: Sliders },
    { id: 'dualsync', label: '2-Song Beat Sync & Compress', icon: Layers },
    { id: 'visuals', label: 'Audio Visualizer Studio', icon: Video },
    { id: 'dashboard', label: 'Console Dashboard', icon: Home },
    { id: 'vibe', label: 'Make It A Vibe Style Lab', icon: Sparkles },
    { id: 'trends', label: 'Trend Discovery', icon: TrendingUp },
    { id: 'rights', label: 'Rights Center', icon: ShieldCheck },
    { id: 'publish', label: 'Publisher & Exports', icon: Send },
  ];

  return (
    <aside className="w-16 md:w-20 flex flex-col items-center justify-between py-5 bg-[#16090a] border-r border-[#311315] select-none z-30 shrink-0">
      {/* Brand Icon at top */}
      <div className="flex flex-col items-center gap-5">
        <button 
          onClick={() => onSelectTab('utilities')}
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#280e10] border border-[#4d191c] hover:border-[#ea3838] transition-all cursor-pointer shadow-lg"
          title="Mizizi Studio Home"
        >
          {/* Stylized Mizizi Logo */}
          <div className="flex items-center justify-center font-black tracking-tighter text-[#ea3838] text-lg font-mono group-hover:scale-110 transition-transform">
            <span className="text-white text-lg">M</span>
            <span className="text-[#ea3838] -ml-0.5 text-xs font-bold">Z</span>
          </div>
          <span className="absolute -bottom-1 w-2 h-0.5 rounded-full bg-[#ea3838] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Navigation Tabs */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative group flex items-center justify-center w-11 h-11 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ea3838] text-white shadow-lg shadow-[#ea3838]/40 scale-105'
                    : 'bg-[#220c0e] text-[#b0878a] hover:text-white hover:bg-[#341315] border border-[#3a1517]'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                {item.badge && (
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] font-black flex items-center justify-center ${
                    isActive ? 'bg-white text-black' : 'bg-[#ea3838] text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on hover */}
                <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Floating Bottom Quick Upload/Plus Button */}
      <div className="flex flex-col items-center gap-2">
        {onOpenInstrumentalSwapper && (
          <button
            onClick={onOpenInstrumentalSwapper}
            className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#280e10] hover:bg-[#f59e0b] text-[#f59e0b] hover:text-black border border-[#4d191c] hover:border-[#f59e0b] shadow-md transition-all active:scale-95 cursor-pointer"
            title="Afrobeat Remixer & Stem Swapper"
          >
            <ArrowRightLeft className="w-5 h-5 transition-transform group-hover:rotate-180" />
            <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              Afrobeat Remixer & Swapper
            </div>
          </button>
        )}

        <button
          onClick={onOpenQuickUpload}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ea3838] to-[#b32025] hover:from-[#ff4747] hover:to-[#ea3838] text-white shadow-xl shadow-[#ea3838]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#ff6b72]/40"
          title="Quick Upload Audio, Video or PDF"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </aside>
  );
};
