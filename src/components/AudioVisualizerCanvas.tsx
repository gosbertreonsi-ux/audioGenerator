import React, { useEffect, useRef, useState } from 'react';
import { globalAudioEngine } from '../lib/audioEngine';
import { TransformationPreset } from '../types';
import { Maximize2, Sparkles, Layers, Ratio } from 'lucide-react';

interface AudioVisualizerCanvasProps {
  trackTitle: string;
  artist: string;
  preset: TransformationPreset;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  visualMode?: 'circular' | 'bars' | 'oscilloscope' | 'particles';
  coverUrl?: string;
  className?: string;
  onSnapshot?: (dataUrl: string) => void;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  trackTitle,
  artist,
  preset,
  aspectRatio = '16:9',
  visualMode = 'circular',
  coverUrl,
  className = '',
  onSnapshot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentMode, setCurrentMode] = useState<'circular' | 'bars' | 'oscilloscope' | 'particles'>(visualMode);
  const [currentRatio, setCurrentRatio] = useState<'16:9' | '9:16' | '1:1'>(aspectRatio);
  const [isExporting, setIsExporting] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setCurrentMode(visualMode);
  }, [visualMode]);

  useEffect(() => {
    setCurrentRatio(aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    // Pre-create floating particle array for particle mode
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 500,
      radius: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.5,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    // Preload cover image if present
    let coverImg: HTMLImageElement | null = null;
    if (coverUrl) {
      coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      coverImg.src = coverUrl;
    }

    const render = () => {
      phase += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // Dark crimson vignette backdrop
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 20,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, '#260e10');
      bgGrad.addColorStop(0.5, '#170809');
      bgGrad.addColorStop(1, '#0c0405');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const analyser = globalAudioEngine.getAnalyser();
      let freqData: Uint8Array = new Uint8Array(new ArrayBuffer(128));
      let timeData: Uint8Array = new Uint8Array(new ArrayBuffer(128));

      let isLiveAudio = false;
      if (analyser) {
        freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        timeData = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        analyser.getByteFrequencyData(freqData as unknown as Uint8Array<ArrayBuffer>);
        analyser.getByteTimeDomainData(timeData as unknown as Uint8Array<ArrayBuffer>);
        // Check if there is actual audio activity
        const sum = freqData.reduce((acc, val) => acc + val, 0);
        isLiveAudio = sum > 100;
      }

      // Compute average energy
      let avgEnergy = 0;
      for (let i = 0; i < 30; i++) {
        avgEnergy += (freqData[i] || 0);
      }
      avgEnergy = avgEnergy / 30 / 255;
      if (!isLiveAudio) {
        avgEnergy = 0.25 + Math.sin(phase * 1.5) * 0.08;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // MODE 1: CIRCULAR RADIAL
      if (currentMode === 'circular') {
        const baseRadius = Math.min(width, height) * 0.22;
        const barCount = 64;

        // Draw central album art circle if available
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.85, 0, Math.PI * 2);
        ctx.clip();
        if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
          ctx.drawImage(
            coverImg,
            centerX - baseRadius * 0.85,
            centerY - baseRadius * 0.85,
            baseRadius * 1.7,
            baseRadius * 1.7
          );
        } else {
          // Fallback crimson glow gradient
          const radGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius);
          radGrad.addColorStop(0, '#ff3b47');
          radGrad.addColorStop(0.6, '#b91c1c');
          radGrad.addColorStop(1, '#1e080a');
          ctx.fillStyle = radGrad;
          ctx.fillRect(centerX - baseRadius, centerY - baseRadius, baseRadius * 2, baseRadius * 2);
        }
        ctx.restore();

        // Glowing perimeter ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.86, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff3b47';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff3b47';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Radial frequency spikes
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 + phase * 0.1;
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2 + i * 0.3) * 0.5 + 0.5) * 0.5 + 0.15;
          }
          const spikeLen = val * (Math.min(width, height) * 0.22) * (1 + avgEnergy * 0.5);

          const x1 = centerX + Math.cos(angle) * (baseRadius * 0.95);
          const y1 = centerY + Math.sin(angle) * (baseRadius * 0.95);
          const x2 = centerX + Math.cos(angle) * (baseRadius * 0.95 + spikeLen);
          const y2 = centerY + Math.sin(angle) * (baseRadius * 0.95 + spikeLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 4 === 0 ? '#ffffff' : i % 2 === 0 ? '#ff4d5a' : '#ea2e3a';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // MODE 2: BARS (SPECTRUM)
      else if (currentMode === 'bars') {
        const barWidth = width / 52;
        const totalBars = 48;
        const startX = (width - totalBars * barWidth) / 2;

        for (let i = 0; i < totalBars; i++) {
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2.5 + i * 0.25) * 0.4 + 0.5) * 0.6;
          }
          const barHeight = val * (height * 0.55);

          const x = startX + i * barWidth;
          const y = height * 0.75 - barHeight;

          const grad = ctx.createLinearGradient(x, y, x, height * 0.75);
          grad.addColorStop(0, '#ff6b72');
          grad.addColorStop(0.3, '#ff3844');
          grad.addColorStop(1, '#3b1013');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x + 2, y, barWidth - 4, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Peak cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 2, y - 4, barWidth - 4, 2);
        }
      }

      // MODE 3: OSCILLOSCOPE (FLUID SINE)
      else if (currentMode === 'oscilloscope') {
        ctx.beginPath();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ff3b47';
        ctx.shadowColor = '#ff3b47';
        ctx.shadowBlur = 14;

        const sliceWidth = width / 128;
        let x = 0;

        for (let i = 0; i < 128; i++) {
          let v = (timeData[i] || 128) / 128.0;
          if (!isLiveAudio) {
            v = 1.0 + Math.sin(phase * 3 + i * 0.12) * 0.25 * Math.cos(phase + i * 0.05);
          }
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // MODE 4: PARTICLES
      else if (currentMode === 'particles') {
        particles.forEach((p, idx) => {
          p.x += p.speedX * (1 + avgEnergy * 2);
          p.y += p.speedY * (1 + avgEnergy * 2);

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const val = (freqData[idx % 30] || 0) / 255;
          const currentRadius = p.radius * (1 + (isLiveAudio ? val * 2.5 : avgEnergy));

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = idx % 3 === 0 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 59, 71, 0.75)';
          ctx.shadowColor = '#ff3b47';
          ctx.shadowBlur = 8;
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      // OVERLAY BRANDING & METADATA
      ctx.save();
      // Style badge in top corner
      ctx.fillStyle = 'rgba(25, 9, 10, 0.8)';
      ctx.strokeStyle = '#4a1e20';
      ctx.lineWidth = 1;
      const tagText = `${preset.name.toUpperCase()} // MUSICMOTION AI`;
      ctx.font = '600 13px "Space Grotesk", sans-serif';
      const textWidth = ctx.measureText(tagText).width;
      ctx.beginPath();
      ctx.roundRect(24, 24, textWidth + 24, 30, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff6b72';
      ctx.fillText(tagText, 36, 44);

      // Track info at bottom
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(trackTitle, 24, height - 42);

      ctx.fillStyle = '#b59395';
      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${artist} · 44.1kHz Hi-Res Audio Stream`, 24, height - 20);

      // Audio reactive watermark indicator at bottom right
      ctx.fillStyle = 'rgba(255, 59, 71, 0.9)';
      ctx.beginPath();
      ctx.arc(width - 32, height - 32, 6 + avgEnergy * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentMode, currentRatio, trackTitle, artist, preset, coverUrl]);

  // Dimension calculator based on aspect ratio
  const getCanvasDimensions = () => {
    switch (currentRatio) {
      case '9:16':
        return { width: 540, height: 960, styleAspect: 'aspect-[9/16]' };
      case '1:1':
        return { width: 720, height: 720, styleAspect: 'aspect-square' };
      case '16:9':
      default:
        return { width: 960, height: 540, styleAspect: 'aspect-video' };
    }
  };

  const dims = getCanvasDimensions();

  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (onSnapshot) {
      onSnapshot(dataUrl);
    } else {
      const link = document.createElement('a');
      link.download = `${trackTitle.toLowerCase().replace(/\s+/g, '_')}_visualizer_frame.png`;
      link.href = dataUrl;
      link.click();
    }
    setTimeout(() => setIsExporting(false), 500);
  };

  return (
    <div className={`relative flex flex-col items-center group ${className}`}>
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-[#190a0c]/80 backdrop-blur-md border border-[#3e1719] opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Visual Mode Selector */}
        {(['circular', 'bars', 'oscilloscope', 'particles'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setCurrentMode(mode)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
              currentMode === mode
                ? 'bg-[#ea3838] text-white shadow-sm shadow-[#ea3838]/40'
                : 'text-[#d4a8aa] hover:text-white hover:bg-[#2c1012]'
            }`}
          >
            {mode}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-[#3e1719] mx-1" />

        {/* Aspect Ratio Selector */}
        {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
          <button
            key={ratio}
            onClick={() => setCurrentRatio(ratio)}
            className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
              currentRatio === ratio
                ? 'bg-[#3b1517] text-[#ff6b72]'
                : 'text-[#a17a7c] hover:text-white'
            }`}
          >
            {ratio}
          </button>
        ))}

        <button
          onClick={handleCaptureSnapshot}
          disabled={isExporting}
          className="ml-1 p-1.5 rounded-lg bg-[#290d0f] hover:bg-[#3d1416] text-[#ff8085] hover:text-white transition-colors"
          title="Export high-res frame snapshot"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* The Visualizer Canvas Container */}
      <div className={`w-full overflow-hidden rounded-2xl border border-[#3e1719] bg-[#0c0405] shadow-2xl ${dims.styleAspect} flex items-center justify-center max-h-[520px]`}>
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
