import React, { useState } from 'react';
import { Search, ShoppingBag, Bell, Wrench, Sliders, Globe } from 'lucide-react';

interface HeaderBarProps {
  userName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeExportsCount?: number;
  onOpenExportsModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenVocalModels?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: any) => void;
  language?: 'EN' | 'SW';
  onToggleLanguage?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userName = 'LEONCE',
  searchQuery,
  onSearchChange,
  activeExportsCount = 3,
  onOpenExportsModal,
  onOpenProfileModal,
  onOpenVocalModels,
  activeTab = 'utilities',
  onSelectTab,
  language = 'EN',
  onToggleLanguage,
}) => {
  const isUtilitiesActive = activeTab === 'utilities';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 py-3.5 bg-[#18090b] border-b border-[#311315] select-none shrink-0 gap-3">
      {/* Left: Mizizi Studio Branding & Dual-Version Top Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#ea3838] to-[#991b1b] text-white font-black text-xs font-mono shadow-md shadow-[#ea3838]/40">
            MZ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-white tracking-tight">MIZIZI STUDIO</span>
              <span className="text-[10px] font-mono text-[#ea3838] font-bold">2.0</span>
            </div>
            <span className="text-[10px] text-[#a67c7f] block -mt-0.5">
              {language === 'SW' ? 'Zana za Kisasa za Ubunifu' : 'Browser Creative & Media Engine'}
            </span>
          </div>
        </div>

        {/* Dual Mode Switcher: Mizizi Utilities vs Creative Studio */}
        {onSelectTab && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#220c0e] border border-[#3d1518] ml-2">
            <button
              onClick={() => onSelectTab('utilities')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isUtilitiesActive
                  ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/40'
                  : 'text-[#a67c7f] hover:text-white'
              }`}
              title="123apps style single-purpose tools for Video, Audio, PDF, Image and File Converters"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Utilities (123apps)</span>
            </button>
            <button
              onClick={() => onSelectTab('vizmotion')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isUtilitiesActive
                  ? 'bg-gradient-to-r from-[#ea3838] to-[#ff4747] text-white shadow-md shadow-[#ea3838]/40'
                  : 'text-[#a67c7f] hover:text-white'
              }`}
              title="Advanced Multitrack Video NLE, Audio DAW, and Lyric Video Sync Studio"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Creative Studio</span>
            </button>
          </div>
        )}
      </div>

      {/* Center: Search input */}
      <div className="flex-1 max-w-sm mx-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8a686b] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder={language === 'SW' ? 'Tafuta zana, sauti, video, PDF...' : 'Search tools, video, audio, PDF, presets...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#240c0e] border border-[#3e1618] focus:border-[#ea3838] focus:outline-none text-xs text-white placeholder-[#7d595c] transition-colors"
          />
        </div>
      </div>

      {/* Right: Language Toggle, Exports & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Bilingual EN / SW Toggle */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] text-[#c59c9f] hover:text-white text-xs font-bold transition-colors cursor-pointer"
            title="Toggle language between English and Swahili (Mizizi = Roots)"
          >
            <Globe className="w-3.5 h-3.5 text-[#ea3838]" />
            <span>{language}</span>
          </button>
        )}

        {/* Vocal Models Modal trigger */}
        {onOpenVocalModels && (
          <button
            onClick={onOpenVocalModels}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2d1013] hover:bg-[#3d1417] border border-[#ea3838]/60 hover:border-[#ea3838] text-[11px] font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Browse Vocal Models"
          >
            <span className="text-[#ff6b72]">✦</span>
            <span>100+ Vocal Models</span>
          </button>
        )}

        {/* Exports / Downloads Bag */}
        <button
          onClick={onOpenExportsModal}
          className="relative p-2 rounded-xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] hover:border-[#ea3838] text-[#c59c9f] hover:text-white transition-colors cursor-pointer"
          title="Active Exports & Queue"
        >
          <ShoppingBag className="w-4 h-4" />
          {activeExportsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#ea3838] text-[10px] font-bold text-white shadow-md shadow-[#ea3838]/50">
              {activeExportsCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] hover:border-[#ea3838] text-[#c59c9f] hover:text-white transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ea3838] ring-2 ring-[#240c0e]" />
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfileModal}
          className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] hover:border-[#ea3838] transition-all cursor-pointer"
          title="Creator Profile"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
            alt={userName}
            className="w-6 h-6 rounded-full object-cover border border-[#ea3838]/50"
          />
          <span className="hidden lg:inline text-xs font-semibold text-white">
            {userName}
          </span>
        </button>
      </div>
    </header>
  );
};
