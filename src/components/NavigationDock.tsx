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
  Film
} from 'lucide-react';

export type NavTab = 'vizmotion' | 'dashboard' | 'studio' | 'vibe' | 'visuals' | 'trends' | 'rights' | 'publish';

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
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'vizmotion', label: 'VIZMOTION AI Video Editor', icon: Film },
    { id: 'dashboard', label: 'Console', icon: Home },
    { id: 'studio', label: 'Studio Engine & Remix', icon: Sliders },
    { id: 'vibe', label: 'Make It A Vibe', icon: Sparkles },
    { id: 'visuals', label: 'Audio Visualizer Studio', icon: Video },
    { id: 'trends', label: 'Trend Discovery', icon: TrendingUp },
    { id: 'rights', label: 'Rights Center', icon: ShieldCheck },
    { id: 'publish', label: 'Publisher', icon: Send },
  ];

  return (
    <aside className="w-16 md:w-20 flex flex-col items-center justify-between py-6 bg-[#16090a] border-r border-[#311315] select-none z-30 shrink-0">
      {/* Brand Icon at top */}
      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={() => onSelectTab('dashboard')}
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#280e10] border border-[#4d191c] hover:border-[#ea3838] transition-all"
          title="MusicMotion AI Home"
        >
          {/* Stylized Logo mark like top-left glyph in image */}
          <div className="flex items-center justify-center font-black tracking-tighter text-[#ea3838] text-lg font-mono group-hover:scale-110 transition-transform">
            <span className="text-white text-xl">M</span>
            <span className="text-[#ea3838] -ml-1 text-xs">▲</span>
          </div>
          <span className="absolute -bottom-1 w-2 h-0.5 rounded-full bg-[#ea3838] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Navigation Tabs */}
        <nav className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative group flex items-center justify-center w-11 h-11 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-[#ea3838] text-white shadow-lg shadow-[#ea3838]/40 scale-105'
                    : 'bg-[#220c0e] text-[#b0878a] hover:text-white hover:bg-[#341315] border border-[#3a1517]'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                {/* Tooltip on hover */}
                <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Floating Bottom Quick Upload/Plus Button (exact match to image bottom left) */}
      <div className="flex flex-col items-center gap-2.5">
        {onOpenInstrumentalSwapper && (
          <button
            onClick={onOpenInstrumentalSwapper}
            className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#280e10] hover:bg-[#f59e0b] text-[#f59e0b] hover:text-black border border-[#4d191c] hover:border-[#f59e0b] shadow-md transition-all active:scale-95"
            title="Afrobeat Remixer & Stem Swapper"
          >
            <ArrowRightLeft className="w-5 h-5 transition-transform group-hover:scale-110" />
            <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
              Afrobeat Remixer & Stem Swapper
            </div>
          </button>
        )}

        {onOpenBeatMaker && (
          <button
            onClick={onOpenBeatMaker}
            className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#280e10] hover:bg-[#8b5cf6] text-[#c084fc] hover:text-white border border-[#4d191c] hover:border-[#8b5cf6] shadow-md transition-all active:scale-95"
            title="16-Step Beat Maker & Sequencer"
          >
            <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
            <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
              16-Step Beat Maker & Sequencer
            </div>
          </button>
        )}

        {onOpenVocalModels && (
          <button
            onClick={onOpenVocalModels}
            className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#280e10] hover:bg-[#ff3b47] text-[#ff6b72] hover:text-white border border-[#4d191c] hover:border-[#ea3838] shadow-md transition-all active:scale-95"
            title="100+ Industry Vocal Models"
          >
            <Mic2 className="w-5 h-5 transition-transform group-hover:scale-110" />
            <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
              100+ Industry Vocal Models (African Suite)
            </div>
          </button>
        )}

        <button
          onClick={onOpenQuickUpload}
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-[#220c0e] hover:bg-[#ea3838] text-[#ea3838] hover:text-white border-2 border-dashed border-[#ea3838]/60 hover:border-solid hover:border-[#ea3838] shadow-lg shadow-[#ea3838]/20 transition-all active:scale-95"
          title="New Song / Transform"
        >
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          <div className="absolute left-16 px-3 py-1.5 rounded-xl bg-[#220d0f] text-white text-xs font-semibold whitespace-nowrap border border-[#4d191c] shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
            Upload & Transform
          </div>
        </button>
      </div>
    </aside>
  );
};
