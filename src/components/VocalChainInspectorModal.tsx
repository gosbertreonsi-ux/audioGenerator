import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Sliders, 
  Sparkles, 
  Building2, 
  Check, 
  Volume2, 
  Play, 
  Pause, 
  Layers 
} from 'lucide-react';
import { VocalModel, TransformationPreset } from '../types';
import { globalAudioEngine } from '../lib/audioEngine';

interface VocalChainInspectorModalProps {
  model: VocalModel | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyModel: (model: VocalModel) => void;
}

export const VocalChainInspectorModal: React.FC<VocalChainInspectorModalProps> = ({
  model,
  isOpen,
  onClose,
  onApplyModel,
}) => {
  if (!isOpen || !model) return null;

  const [currentSettings, setCurrentSettings] = useState(model.settings);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSliderChange = (key: keyof VocalModel['settings'], value: number | string) => {
    const updated = { ...currentSettings, [key]: value };
    setCurrentSettings(updated);

    // Apply real-time to audio engine
    const preset: TransformationPreset = {
      id: model.id,
      name: model.name,
      category: 'Experimental',
      badge: model.companyOrLabel.split('/')[0].trim(),
      description: model.description,
      speed: 1.0,
      pitch: Number(updated.pitchShift),
      reverbWet: Number(updated.reverbWet),
      reverbDecay: Number(updated.reverbDecay),
      bassBoost: Number(updated.pitchShift) < 0 ? 5.0 : 2.0,
      stereoWidth: Number(updated.doublerWidth),
      pan8d: false,
      panSpeed: 0.1,
      lofiCutoff: 19000,
      color: model.color,
    };
    globalAudioEngine.setTransformation(preset);
  };

  const handleTogglePlay = () => {
    globalAudioEngine.togglePlay();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#17090b] border border-[#3e1618] shadow-2xl flex flex-col overflow-hidden text-[#f4e8e8]">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#2d1013] flex items-center justify-between bg-[#1e0a0d]">
          <div>
            <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-[#ff6b72]">
              <Building2 className="w-3.5 h-3.5" />
              <span>{model.companyOrLabel}</span>
              <span>·</span>
              <span className="text-emerald-400">★ {model.popularityScore}% Score</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              {model.name}
            </h2>
            <p className="text-xs text-[#a67c7f] mt-0.5">
              {model.vocalistArchetype} · Hardware & DSP Chain Blueprint
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-[#a67c7f] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hardware Emulation Banner */}
        <div className="p-4 bg-[#140608] border-b border-[#2d1013] flex items-center gap-3">
          <Cpu className="w-5 h-5 text-[#ea3838] shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white">Analog Hardware Chain: </span>
            <span className="text-[#ff6b72]">{model.hardwarePedigree}</span>
          </div>
        </div>

        {/* Interactive Parameter Knobs */}
        <div className="p-5 md:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto-Tune Retune Speed */}
            <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">Auto-Tune Speed</span>
                <span className="font-mono text-[#ff6b72]">
                  {currentSettings.autotuneSpeed === 0 ? '0 ms (Hard Robot)' : `${currentSettings.autotuneSpeed} ms`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={currentSettings.autotuneSpeed}
                onChange={(e) => handleSliderChange('autotuneSpeed', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#140708] rounded accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">0ms = Travis/T-Pain, 20ms+ = Natural Pitch</span>
            </div>

            {/* Pitch & Formant Shift */}
            <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">Pitch Transpose</span>
                <span className="font-mono text-[#ff6b72]">
                  {currentSettings.pitchShift > 0 ? `+${currentSettings.pitchShift}` : currentSettings.pitchShift} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={currentSettings.pitchShift}
                onChange={(e) => handleSliderChange('pitchShift', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#140708] rounded accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">-12 = Sub Octave, +4 = Hyperpop Carti</span>
            </div>

            {/* Preamp Saturation Drive */}
            <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">Tube / Console Drive</span>
                <span className="font-mono text-[#ff6b72]">{currentSettings.saturationDrive}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={currentSettings.saturationDrive}
                onChange={(e) => handleSliderChange('saturationDrive', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#140708] rounded accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Neve 1073 & Studer tape harmonic clipping</span>
            </div>

            {/* Reverb Space Mix */}
            <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">Space / Reverb Wet</span>
                <span className="font-mono text-[#ff6b72]">{(currentSettings.reverbWet * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentSettings.reverbWet}
                onChange={(e) => handleSliderChange('reverbWet', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Decay tail: {currentSettings.reverbDecay.toFixed(1)}s</span>
            </div>

            {/* Stereo Doubler Width */}
            <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">Stereo Doubler Spread</span>
                <span className="font-mono text-[#ff6b72]">{currentSettings.doublerWidth}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={currentSettings.doublerWidth}
                onChange={(e) => handleSliderChange('doublerWidth', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Micro-pitch detuning stereo widener</span>
            </div>

            {/* Air Band & De-Essing */}
            <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-white">16kHz Silk Air Band</span>
                <span className="font-mono text-[#ff6b72]">+{currentSettings.airBandBoost} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={currentSettings.airBandBoost}
                onChange={(e) => handleSliderChange('airBandBoost', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#140708] rounded accent-[#ea3838] cursor-pointer"
              />
              <span className="text-[10px] text-[#8a686b] block">Maag EQ4 air band vocal sheen</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-5 border-t border-[#2d1013] bg-[#1a080a] flex items-center justify-between gap-4">
          <button
            onClick={handleTogglePlay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-white border border-[#441619] text-xs font-bold transition-all shadow-md active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 text-[#ff6b72]" />
                Pause Preview
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-[#ff6b72]" />
                Test Vocal Model
              </>
            )}
          </button>

          <button
            onClick={() => {
              onApplyModel({ ...model, settings: currentSettings });
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 hover:scale-105 transition-all active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply to Current Project
          </button>
        </div>
      </div>
    </div>
  );
};
