import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Mic2, 
  Music, 
  Layers, 
  Check, 
  Loader2, 
  Radio, 
  Headphones, 
  Sparkles 
} from 'lucide-react';
import { AudioTrack, TransformationPreset, VocalModel } from '../types';
import { globalAudioEngine } from '../lib/audioEngine';

interface DownloadStemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: AudioTrack;
  preset: TransformationPreset;
  activeVocalModel?: VocalModel | null;
  activeStackSummary?: string[];
}

export const DownloadStemsModal: React.FC<DownloadStemsModalProps> = ({
  isOpen,
  onClose,
  track,
  preset,
  activeVocalModel,
  activeStackSummary = [],
}) => {
  const [downloadingStem, setDownloadingStem] = useState<string | null>(null);
  const [downloadedStems, setDownloadedStems] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleDownload = async (stemType: 'master' | 'vocals' | 'instrumental' | 'swapped_remix' | 'all') => {
    setDownloadingStem(stemType);
    try {
      if (stemType === 'all') {
        // Download Master
        const masterBlob = await globalAudioEngine.renderAndExportWAV({ stemType: 'master' });
        triggerDownload(masterBlob, `${track.title}_MASTER_${preset.name.replace(/\s+/g, '_')}.wav`);

        // Download Vocals (Words Only)
        const vocalBlob = await globalAudioEngine.renderAndExportWAV({ stemType: 'vocals' });
        triggerDownload(vocalBlob, `${track.title}_WORDS_ONLY_VOCALS_${preset.name.replace(/\s+/g, '_')}.wav`);

        // Download Instrumental
        const instBlob = await globalAudioEngine.renderAndExportWAV({ stemType: 'instrumental' });
        triggerDownload(instBlob, `${track.title}_INSTRUMENTAL_${preset.name.replace(/\s+/g, '_')}.wav`);

        // Download Swapped Remix if preset has swap
        if (preset.instrumentalSwap && preset.instrumentalSwap !== 'none') {
          const swapBlob = await globalAudioEngine.renderAndExportWAV({ stemType: 'swapped_remix' });
          triggerDownload(swapBlob, `${track.title}_AFRO_REMIX_${preset.instrumentalSwap.toUpperCase()}.wav`);
        }

        setDownloadedStems((prev) => ({ ...prev, all: true, master: true, vocals: true, instrumental: true, swapped_remix: true }));
      } else {
        const blob = await globalAudioEngine.renderAndExportWAV({ stemType });
        const suffix = stemType === 'vocals' ? 'WORDS_ONLY_VOCALS' 
          : stemType === 'instrumental' ? 'INSTRUMENTAL' 
          : stemType === 'swapped_remix' ? 'AFRO_REMIX_MASTER' : 'MASTER';
        triggerDownload(blob, `${track.title}_${suffix}_${preset.name.replace(/\s+/g, '_')}.wav`);
        setDownloadedStems((prev) => ({ ...prev, [stemType]: true }));
      }
    } catch (err) {
      console.error('Failed to export audio:', err);
    } finally {
      setDownloadingStem(null);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#17090b] border border-[#3e1618] shadow-2xl flex flex-col overflow-hidden text-[#f4e8e8]">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#2d1013] flex items-center justify-between bg-[#1e0a0d]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838]/20 border border-[#ea3838]/40 text-[#ff6b72] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Download className="w-3 h-3" />
                STEM EXPORT & MULTI-MODAL DOWNLOAD
              </span>
              {preset.pan8d && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                  8D Baked Into Output
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              DOWNLOAD EDITED AUDIO & VOCALS
            </h2>
            <p className="text-xs text-[#a67c7f] mt-0.5">
              Export 16-bit 44.1kHz Hi-Res WAV files with all active layered effects.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-[#a67c7f] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Stack Summary Banner */}
        <div className="p-4 bg-[#140608] border-b border-[#2d1013] space-y-1.5">
          <span className="text-[11px] font-bold text-[#8a686b] uppercase block">
            ACTIVE PROCESSING CHAIN TO BE EXPORTED:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeStackSummary.length > 0 ? (
              activeStackSummary.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#240c0e] border border-[#3e1618] text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea3838]" />
                  {item}
                </span>
              ))
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-[#240c0e] border border-[#3e1618] text-xs font-bold text-white">
                {preset.name}
              </span>
            )}

            {activeVocalModel && (
              <span className="px-2.5 py-1 rounded-lg bg-[#341215] border border-[#ea3838] text-xs font-black text-[#ff6b72] flex items-center gap-1.5">
                <Mic2 className="w-3 h-3" />
                Vocal: {activeVocalModel.name}
              </span>
            )}

            {preset.pan8d && (
              <span className="px-2.5 py-1 rounded-lg bg-[#1a2e22] border border-emerald-500/50 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Headphones className="w-3 h-3" />
                360° 8D Audio Rotation
              </span>
            )}
          </div>
        </div>

        {/* Export Options Cards */}
        <div className="p-5 md:p-6 space-y-3.5 max-h-[55vh] overflow-y-auto">
          {/* 1. Full Master Mix */}
          <div className="p-4 rounded-2xl bg-[#1e0a0d] border border-[#371518] hover:border-[#ea3838] transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#2b0f12] border border-[#441619] flex items-center justify-center text-[#ff6b72] shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Full Master Mix (.WAV)
                  {downloadedStems.master && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </h4>
                <p className="text-xs text-[#a67c7f] mt-0.5">
                  Complete track with stacked styles, 8D binaural headphone movement, and processed vocals.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('master')}
              disabled={Boolean(downloadingStem)}
              className="px-4 py-2 rounded-xl bg-[#ea3838] hover:bg-[#ff4d4d] text-white text-xs font-bold shadow-md shadow-[#ea3838]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {downloadingStem === 'master' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloadedStems.master ? 'Downloaded' : 'Download'}
            </button>
          </div>

          {/* 2. Isolated Edited Vocals */}
          <div className="p-4 rounded-2xl bg-[#1e0a0d] border border-[#371518] hover:border-[#ea3838] transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#351216] border border-[#ea3838]/50 flex items-center justify-center text-[#ff6b72] shrink-0">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Isolated Edited Vocals (.WAV)
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-[#ea3838] text-[9px] font-black text-white">
                    REQUESTED
                  </span>
                  {downloadedStems.vocals && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-xs text-[#a67c7f] mt-0.5">
                  Pure vocal stem rendered with your 8D spatial motion, pitch shift, reverb, and vocal model DSP.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('vocals')}
              disabled={Boolean(downloadingStem)}
              className="px-4 py-2 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-white border border-[#4a1c20] hover:border-[#ea3838] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {downloadingStem === 'vocals' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff6b72]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#ff6b72]" />
              )}
              {downloadedStems.vocals ? 'Downloaded' : 'Download Stem'}
            </button>
          </div>

          {/* 3. Instrumental Backing */}
          <div className="p-4 rounded-2xl bg-[#1e0a0d] border border-[#371518] hover:border-[#ea3838] transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#2b0f12] border border-[#441619] flex items-center justify-center text-[#ff6b72] shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Instrumental Backing Track (.WAV)
                  {downloadedStems.instrumental && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </h4>
                <p className="text-xs text-[#a67c7f] mt-0.5">
                  Vocal-suppressed instrumental backing with bass, tempo stretch, and 8D spatial treatment.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('instrumental')}
              disabled={Boolean(downloadingStem)}
              className="px-4 py-2 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-white border border-[#4a1c20] hover:border-[#ea3838] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {downloadingStem === 'instrumental' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff6b72]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#ff6b72]" />
              )}
              {downloadedStems.instrumental ? 'Downloaded' : 'Download'}
            </button>
          </div>
        </div>

        {/* Footer: Download All Bundle Button */}
        <div className="p-4 md:p-5 border-t border-[#2d1013] bg-[#1a080a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#8a686b] text-center sm:text-left">
            All files rendered directly in uncompressed 32-bit floating point converted to 16-bit PCM WAV.
          </div>

          <button
            onClick={() => handleDownload('all')}
            disabled={Boolean(downloadingStem)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloadingStem === 'all' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rendering Full Stems Bundle...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Download All 3 Stems (Master + Vocals + Inst)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
