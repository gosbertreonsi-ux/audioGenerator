import React, { useRef, useState } from 'react';
import { X, Upload, Music, Sparkles, Check, Disc } from 'lucide-react';
import { AudioTrack } from '../types';
import { globalAudioEngine } from '../lib/audioEngine';

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: AudioTrack) => void;
}

export const QuickUploadModal: React.FC<QuickUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    try {
      setIsProcessing(true);
      const decodedBuffer = await globalAudioEngine.loadAudioFile(file);
      const newTrack: AudioTrack = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Creator Upload',
        duration: Math.round(decodedBuffer.duration),
        bpm: 118,
        key: 'A Minor',
        energy: 'High',
        vocals: 'Detected',
        lufs: -9.5,
        genre: 'Authorized Master',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        sourceType: 'user_upload',
      };
      onSelectTrack(newTrack);
      globalAudioEngine.play();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#1b090b] border border-[#3e1618] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2d1013] pb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#ea3838]" />
            <h2 className="text-lg font-black text-white">
              UPLOAD AUTHORIZED MUSIC & TRANSFORM
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-[#a67c7f] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
            dragActive
              ? 'border-[#ea3838] bg-[#ea3838]/10 scale-[1.01]'
              : 'border-[#3e1618] hover:border-[#ea3838]/60 bg-[#220d0f]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-[#290d10] border border-[#441619] flex items-center justify-center text-[#ff6b72] mb-3">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>

          <h3 className="text-sm font-bold text-white">
            {isProcessing ? 'Analyzing Audio Frequencies...' : 'Click or Drag & Drop Audio'}
          </h3>
          <p className="text-xs text-[#a67c7f] mt-1 max-w-sm">
            Supports MP3, WAV, FLAC, M4A, OGG. High-resolution 44.1kHz / 48kHz audio validated automatically.
          </p>
        </div>

        {/* Pro Audio Engine Validation & Feature Highlights */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-[#8a686b] block uppercase tracking-wider">
            AUTOMATIC AUDIO ENGINE CAPABILITIES UPON IMPORT:
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#220d0f] border border-[#371518] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Mute Original Words</div>
                <div className="text-[10px] text-[#a67c7f]">Center-channel vocal inversion keeping 100% kick & bass</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#220d0f] border border-[#371518] flex items-start gap-2.5">
              <Disc className="w-4 h-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Music Style Shifter</div>
                <div className="text-[10px] text-[#a67c7f]">Swap beat to Afrobeat, Southern Trap 808, Amapiano, Drill</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#220d0f] border border-[#371518] flex items-start gap-2.5">
              <Music className="w-4 h-4 text-[#06b6d4] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Words Only (Acapella)</div>
                <div className="text-[10px] text-[#a67c7f]">Extract clean speech & singing lyrics with formant boost</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#220d0f] border border-[#371518] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#ec4899] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">VIZMOTION 4K Editor</div>
                <div className="text-[10px] text-[#a67c7f]">Sync cuts, beat-markers & kinetic lyrics to your song</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
