import React from 'react';
import { Collaborator } from '../types';
import { Radio } from 'lucide-react';

interface CollaboratorsRailProps {
  collaborators: Collaborator[];
  onSelectCollaborator?: (collaborator: Collaborator) => void;
}

export const CollaboratorsRail: React.FC<CollaboratorsRailProps> = ({
  collaborators,
  onSelectCollaborator,
}) => {
  return (
    <aside className="hidden xl:flex flex-col items-center py-6 px-2.5 bg-[#17090a] border-l border-[#311315] select-none shrink-0 gap-4">
      {/* Top Header Pill */}
      <div 
        className="flex items-center justify-center w-9 h-9 rounded-full bg-[#260e10] border border-[#441619] text-[#ea3838]" 
        title="Active Studio Producers"
      >
        <Radio className="w-4 h-4 animate-pulse" />
      </div>

      {/* Collaborator Avatars Stack */}
      <div className="flex flex-col items-center gap-3">
        {collaborators.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCollaborator?.(c)}
            className="group relative flex items-center justify-center focus:outline-none"
            title={`${c.name} (${c.role}) - ${c.status}`}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden p-0.5 border border-[#441619] group-hover:border-[#ea3838] transition-all group-hover:scale-105">
              <img
                src={c.avatar?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                alt={c.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            {/* Status dot */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#17090a] ${
                c.status === 'In Studio'
                  ? 'bg-emerald-500'
                  : c.status === 'Rendering'
                  ? 'bg-[#ea3838] animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            {/* Real fixed dot if pinging */}
            {c.status === 'Rendering' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#17090a] bg-[#ea3838]" />
            )}

            {/* Hover card */}
            <div className="absolute right-14 px-3 py-2 rounded-xl bg-[#220d0f] text-left border border-[#4d191c] shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 whitespace-nowrap min-w-[160px]">
              <div className="text-xs font-bold text-white">{c.name}</div>
              <div className="text-[11px] text-[#b0878a]">{c.role}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {c.status}
              </div>
              {c.currentTrack && (
                <div className="mt-1 text-[10px] text-[#d6a5a8] truncate max-w-[150px]">
                  🎧 {c.currentTrack}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="w-6 h-[1px] bg-[#311315] my-1" />

      {/* R* style / Platform brand badge */}
      <div 
        className="w-8 h-8 rounded-xl bg-[#280e10] border border-[#441619] flex items-center justify-center text-[11px] font-bold text-[#ea3838]"
        title="Certified Audio Engine"
      >
        M★
      </div>
    </aside>
  );
};
