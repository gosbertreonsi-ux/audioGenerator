import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sliders, 
  Play, 
  Pause, 
  Volume2, 
  Sparkles, 
  Building2, 
  Cpu, 
  Check, 
  Flame 
} from 'lucide-react';
import { VocalModel, TransformationPreset } from '../types';
import { ALL_VOCAL_MODELS } from '../lib/vocalModelsData';
import { globalAudioEngine } from '../lib/audioEngine';

interface VocalModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVocalModel: (model: VocalModel) => void;
  onInspectChain: (model: VocalModel) => void;
  currentActiveModelId?: string;
}

export const VocalModelsModal: React.FC<VocalModelsModalProps> = ({
  isOpen,
  onClose,
  onSelectVocalModel,
  onInspectChain,
  currentActiveModelId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Afrobeat & West African',
    'Amapiano & Southern African',
    'East & Central African',
    'North African & Maghreb',
    'Words Only & Acapella Isolators',
    'Pop & Billboard',
    'Hip-Hop & Trap',
    'R&B & Neo-Soul',
    'Drill & UK',
    'Hyperpop & Glitch',
    'Rock & Alternative',
    'Electronic & Dance',
    'Cinematic & Choral',
    'Retro & Vintage',
  ];

  const filteredModels = ALL_VOCAL_MODELS.filter((m) => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.companyOrLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hardwarePedigree.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleAudition = (model: VocalModel) => {
    // Map vocal settings to real-time audio engine DSP
    const preset: TransformationPreset = {
      id: model.id,
      name: model.name,
      category: 'Experimental',
      badge: model.companyOrLabel.split('/')[0].trim(),
      description: model.description,
      speed: 1.0,
      pitch: model.settings.pitchShift,
      reverbWet: model.settings.reverbWet,
      reverbDecay: model.settings.reverbDecay,
      bassBoost: model.settings.pitchShift < 0 ? 5.0 : 2.0,
      stereoWidth: model.settings.doublerWidth,
      pan8d: model.category === 'Cinematic & Choral' || model.category === 'R&B & Neo-Soul',
      panSpeed: 0.1,
      lofiCutoff: model.category === 'Retro & Vintage' ? 3800 : 19000,
      color: model.color,
    };

    globalAudioEngine.setTransformation(preset);
    globalAudioEngine.play();
    setPreviewingId(model.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-[#17090b] border border-[#3e1618] shadow-2xl flex flex-col overflow-hidden text-[#f4e8e8]">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#2d1013] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-[#1e0a0d]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838]/20 border border-[#ea3838]/40 text-[#ff6b72] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                MAJOR RECORD LABELS & RECORDING STUDIOS
              </span>
              <span className="text-xs text-[#a67c7f]">
                {ALL_VOCAL_MODELS.length} Industry Vocal Chains
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              100+ INDUSTRY VOCAL MODELS & HARMONIZERS
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-[#a67c7f] hover:text-white transition-colors self-end md:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 md:p-5 border-b border-[#2d1013] space-y-3 shrink-0 bg-[#150708]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a686b] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 100+ models by artist, label (Republic, Cactus Jack, OVO, Sony, Abbey Road), mic or gear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#220d0f] border border-[#3e1618] text-xs md:text-sm text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/30 scale-[1.02]'
                    : 'bg-[#220d0f] text-[#a67c7f] hover:text-white border border-[#371518]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List of 100+ Vocal Models */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredModels.map((model) => {
            const isSelected = currentActiveModelId === model.id;
            const isAuditioning = previewingId === model.id;

            return (
              <div
                key={model.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group ${
                  isSelected
                    ? 'bg-[#2d1013] border-[#ea3838] shadow-lg shadow-[#ea3838]/25 ring-1 ring-[#ea3838]'
                    : 'bg-[#1b090b] hover:bg-[#220c0e] border-[#371518]'
                }`}
              >
                <div>
                  {/* Top company/label and popularity badge */}
                  <div className="flex items-center justify-between text-[10px] text-[#a67c7f] mb-1">
                    <span className="flex items-center gap-1 font-bold text-[#ff6b72] truncate max-w-[200px]">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {model.companyOrLabel}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#290d10] text-emerald-400 font-bold border border-[#441619]">
                      ★ {model.popularityScore}%
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white group-hover:text-[#ff6b72] transition-colors leading-snug">
                    {model.name}
                  </h3>
                  <div className="text-[11px] font-semibold text-[#c59c9f] mt-0.5">
                    {model.vocalistArchetype}
                  </div>
                  <p className="text-[11px] text-[#8a686b] mt-1.5 line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>

                  {/* Hardware pedigree line */}
                  <div className="mt-2.5 p-2 rounded-xl bg-[#140608] border border-[#2d1013] flex items-center gap-1.5 text-[10px] text-[#b0878a]">
                    <Cpu className="w-3 h-3 text-[#ea3838] shrink-0" />
                    <span className="truncate">{model.hardwarePedigree}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-[#2d1013] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleAudition(model)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isAuditioning
                        ? 'bg-[#ea3838] text-white shadow-md'
                        : 'bg-[#260e10] text-[#c59c9f] hover:text-white hover:bg-[#341215]'
                    }`}
                    title="Audition live with current audio"
                  >
                    <Volume2 className="w-3 h-3" />
                    {isAuditioning ? 'Auditioning' : 'Audition'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onInspectChain(model)}
                      className="p-1.5 rounded-xl bg-[#220d0f] hover:bg-[#311315] text-[#a67c7f] hover:text-white transition-colors"
                      title="Inspect hardware DSP chain"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectVocalModel(model);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] text-white text-xs font-bold shadow-md shadow-[#ea3838]/30 hover:scale-105 transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Count */}
        <div className="p-3 border-t border-[#2d1013] bg-[#120506] text-center text-xs text-[#8a686b]">
          Showing {filteredModels.length} of {ALL_VOCAL_MODELS.length} big-label vocal chains. Click Audition to hear instantly.
        </div>
      </div>
    </div>
  );
};
