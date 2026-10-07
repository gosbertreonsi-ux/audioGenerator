import React from 'react';
import { Search, ShoppingBag, Bell } from 'lucide-react';

interface HeaderBarProps {
  userName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeExportsCount?: number;
  onOpenExportsModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenVocalModels?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  userName = 'NIKITIN',
  searchQuery,
  onSearchChange,
  activeExportsCount = 3,
  onOpenExportsModal,
  onOpenProfileModal,
  onOpenVocalModels,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#18090b] border-b border-[#311315] select-none shrink-0">
      {/* Left: Greeting matching the screenshot font & style */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-[#a88285] font-normal">Good evening,</span>
          <span className="font-extrabold text-[#ffffff] uppercase tracking-wider">{userName}</span>
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#290e10] border border-[#441619] text-[11px] text-[#ff6b72] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Pro Studio Live
        </div>
        {onOpenVocalModels && (
          <button
            onClick={onOpenVocalModels}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d1013] hover:bg-[#3d1417] border border-[#ea3838]/60 hover:border-[#ea3838] text-[11px] font-bold text-white shadow-sm transition-all active:scale-95"
            title="Browse 100+ Major Record Label Vocal Models"
          >
            <span className="text-[#ff6b72]">✦</span>
            100+ Vocal Models
          </button>
        )}
      </div>

      {/* Center: Search pill bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8a686b] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search styles, tracks, content packs, presets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#240c0e] border border-[#3e1618] focus:border-[#ea3838] focus:outline-none text-sm text-white placeholder-[#7d595c] transition-colors"
          />
        </div>
      </div>

      {/* Right: Quick action pills */}
      <div className="flex items-center gap-3">
        {/* Exports / Downloads Bag */}
        <button
          onClick={onOpenExportsModal}
          className="relative p-2.5 rounded-2xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] hover:border-[#ea3838] text-[#c59c9f] hover:text-white transition-colors"
          title="Active Exports & Queue"
        >
          <ShoppingBag className="w-4 h-4" />
          {activeExportsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#ea3838] text-[10px] font-bold text-white shadow-md shadow-[#ea3838]/50">
              {activeExportsCount}
            </span>
          )}
        </button>

        {/* Notifications Bell with unread dot */}
        <button
          className="relative p-2.5 rounded-2xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] hover:border-[#ea3838] text-[#c59c9f] hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ea3838] ring-2 ring-[#240c0e]" />
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfileModal}
          className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-2xl bg-[#240c0e] hover:bg-[#341215] border border-[#3e1618] hover:border-[#ea3838] transition-all group"
          title="Creator Profile & Settings"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
            alt={userName}
            className="w-7 h-7 rounded-full object-cover border border-[#ea3838]/50"
          />
          <span className="hidden md:inline text-xs font-semibold text-white group-hover:text-[#ff6b72]">
            {userName}
          </span>
        </button>
      </div>
    </header>
  );
};
