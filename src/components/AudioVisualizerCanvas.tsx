import React, { useEffect, useRef, useState, useMemo } from 'react';
import { globalAudioEngine } from '../lib/audioEngine';
import { TransformationPreset, VideoVisualizerSettings } from '../types';
import { Maximize2 } from 'lucide-react';

export interface AudioVisualizerCanvasProps {
  trackTitle: string;
  artist: string;
  preset?: TransformationPreset;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  visualMode?: 'circular' | 'bars' | 'mirror_bars' | 'oscilloscope' | 'particles' | 'orbit8d' | 'pulse_ring' | 'cassette_vu';
  coverUrl?: string;
  className?: string;
  settings?: Partial<VideoVisualizerSettings>;
  onSnapshot?: (dataUrl: string) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  trackTitle,
  artist,
  preset,
  aspectRatio = '16:9',
  visualMode = 'circular',
  coverUrl,
  className = '',
  settings,
  onSnapshot,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Merge direct props with settings object
  const currentRatio = settings?.aspectRatio || aspectRatio;
  const currentMode = settings?.visualMode || visualMode;
  const wavePos = settings?.wavePosition || 'bottom';
  const customColor = settings?.customColor || (preset?.color || '#ea3838');
  const secondaryColor = settings?.secondaryColor || '#ff6b72';
  const sensitivity = settings?.sensitivity ?? 1.35;
  const barCount = settings?.barCount ?? 54;
  const barWidth = settings?.barWidth ?? 6;
  const glowIntensity = Math.min(10, settings?.glowIntensity ?? 8);
  const waveOpacity = settings?.waveOpacity ?? 0.95;
  const bgImageSrc = settings?.backgroundImage || (settings?.backgroundPreset === 'album_cover' ? coverUrl : null);
  const bgDim = settings?.backgroundDim ?? 0.45;
  const bgBlur = settings?.backgroundBlur ?? 0;
  const bassPulseBg = settings?.bassPulseBg ?? true;
  const showCoverCenter = settings?.showCoverCenter ?? true;
  const displayTitle = settings?.titleText || trackTitle;
  const displayArtist = settings?.artistText || artist;
  const displayBadge = settings?.badgeText || (preset?.name ? `${preset.name.toUpperCase()} // 8D TUNES` : '8D TUNES 360° AUDIO');
  const showWatermark = settings?.showWatermark ?? true;
  const watermarkText = settings?.watermarkText || 'LEONCE STUDIOS • 8D AUDIO';
  const showLyrics = settings?.showLyrics ?? false;
  const lyricsText = settings?.lyricsText || 'Driving into the midnight rain...';
  const textPosition = settings?.textPosition || 'bottom_left';

  // Inform parent of canvas reference ONCE or when ref mounts, avoiding infinite render loops
  const onCanvasReadyRef = useRef(onCanvasReady);
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady;
  });

  useEffect(() => {
    if (onCanvasReadyRef.current && canvasRef.current) {
      onCanvasReadyRef.current(canvasRef.current);
    }
  }, []);

  // Standard Broadcast HD 720p dimensions (lightweight, zero memory leak, highly stable for real-time capture)
  const dims = useMemo(() => {
    switch (currentRatio) {
      case '9:16':
        return { width: 720, height: 1280, styleAspect: 'aspect-[9/16]' };
      case '1:1':
        return { width: 720, height: 720, styleAspect: 'aspect-square' };
      case '16:9':
      default:
        return { width: 1280, height: 720, styleAspect: 'aspect-video' };
    }
  }, [currentRatio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    // Floating particles pool
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * dims.width,
      y: Math.random() * dims.height,
      radius: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    // Safe offscreen background buffer with CORS taint isolation
    let offscreenBg: HTMLCanvasElement | null = null;
    const validBgSrc = (typeof bgImageSrc === 'string' && bgImageSrc.trim() !== '') ? bgImageSrc.trim() : null;
    if (validBgSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const off = document.createElement('canvas');
          off.width = dims.width;
          off.height = dims.height;
          const offCtx = off.getContext('2d');
          if (offCtx) {
            if (bgBlur > 0) {
              offCtx.filter = `blur(${Math.min(16, bgBlur)}px)`;
            }
            offCtx.drawImage(img, 0, 0, dims.width, dims.height);
            // Verify canvas is not tainted
            offCtx.getImageData(0, 0, 1, 1);
            offscreenBg = off;
          }
        } catch {
          // If CORS failed or tainted, fail gracefully so visualizer stays exportable
          offscreenBg = null;
        }
      };
      img.onerror = () => {
        offscreenBg = null;
      };
      img.src = validBgSrc;
    }

    // Safe offscreen central cover buffer
    let offscreenCover: HTMLCanvasElement | null = null;
    const rawCover = (typeof coverUrl === 'string' && coverUrl.trim() !== '') ? coverUrl.trim() : validBgSrc;
    const coverToLoad = rawCover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80';
    if (coverToLoad) {
      const cImg = new Image();
      cImg.crossOrigin = 'anonymous';
      cImg.onload = () => {
        try {
          const off = document.createElement('canvas');
          off.width = 256;
          off.height = 256;
          const offCtx = off.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(cImg, 0, 0, 256, 256);
            offCtx.getImageData(0, 0, 1, 1);
            offscreenCover = off;
          }
        } catch {
          offscreenCover = null;
        }
      };
      cImg.onerror = () => {
        offscreenCover = null;
      };
      cImg.src = coverToLoad;
    }

    const render = () => {
      phase += 0.035;
      const width = canvas.width;
      const height = canvas.height;

      // Extract Web Audio frequency and time-domain data
      const analyser = globalAudioEngine.getAnalyser();
      let freqData = new Uint8Array(64);
      let isLiveAudio = false;

      if (analyser) {
        try {
          freqData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < 30; i++) sum += freqData[i] || 0;
          isLiveAudio = sum > 60;
        } catch {
          isLiveAudio = false;
        }
      }

      // Energy calculations
      let bassSum = 0;
      for (let i = 0; i < 6; i++) bassSum += freqData[i] || 0;
      let bassEnergy = bassSum / 6 / 255;

      let avgEnergy = 0;
      for (let i = 0; i < 28; i++) avgEnergy += freqData[i] || 0;
      avgEnergy = avgEnergy / 28 / 255;

      if (!isLiveAudio) {
        bassEnergy = 0.28 + Math.sin(phase * 2.2) * 0.12;
        avgEnergy = 0.25 + Math.sin(phase * 1.6) * 0.08;
      }

      // 1. BACKGROUND RENDERING
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const bgScale = bassPulseBg ? 1.0 + bassEnergy * 0.03 : 1.0;
      const bgOffsetX = (width * (1 - bgScale)) / 2;
      const bgOffsetY = (height * (1 - bgScale)) / 2;

      if (offscreenBg) {
        ctx.drawImage(offscreenBg, bgOffsetX, bgOffsetY, width * bgScale, height * bgScale);
        if (bgDim > 0) {
          ctx.fillStyle = `rgba(10, 3, 4, ${bgDim})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        // High quality dark cyber gradient backdrop
        const grad = ctx.createRadialGradient(
          width / 2, height / 2, 60,
          width / 2, height / 2, Math.max(width, height) * 0.75
        );
        grad.addColorStop(0, '#2b0e11');
        grad.addColorStop(0.5, '#180709');
        grad.addColorStop(1, '#090203');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Cyber grid
        ctx.strokeStyle = 'rgba(234, 56, 56, 0.06)';
        ctx.lineWidth = 1;
        const gridStep = 60;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2. AUDIO WAVEFORM OVERLAYS
      ctx.save();
      ctx.globalAlpha = waveOpacity;

      let baseY = height * 0.82;
      if (wavePos === 'bottom') baseY = height * 0.86;
      else if (wavePos === 'lower_third') baseY = height * 0.72;
      else if (wavePos === 'horizon') baseY = height * 0.52;
      else if (wavePos === 'center') baseY = height * 0.50;
      else if (wavePos === 'ambient') baseY = height * 0.65;

      const centerX = width / 2;
      const centerY = wavePos === 'center' || wavePos === 'horizon' ? height / 2 : baseY;

      // MODE 1: CIRCULAR 360° RADIAL
      if (currentMode === 'circular') {
        const baseRadius = Math.min(width, height) * 0.22 * (1 + bassEnergy * 0.08);
        const actualBarCount = Math.max(32, Math.min(72, barCount));

        if (showCoverCenter) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * 0.85, 0, Math.PI * 2);
          ctx.clip();
          if (offscreenCover) {
            ctx.drawImage(
              offscreenCover,
              centerX - baseRadius * 0.85,
              centerY - baseRadius * 0.85,
              baseRadius * 1.7,
              baseRadius * 1.7
            );
          } else {
            const radGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, baseRadius);
            radGrad.addColorStop(0, customColor);
            radGrad.addColorStop(0.7, '#6b1115');
            radGrad.addColorStop(1, '#1a0608');
            ctx.fillStyle = radGrad;
            ctx.fillRect(centerX - baseRadius, centerY - baseRadius, baseRadius * 2, baseRadius * 2);
          }
          ctx.restore();

          // Glowing perimeter
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * 0.86, 0, Math.PI * 2);
          ctx.strokeStyle = customColor;
          ctx.lineWidth = 3;
          if (glowIntensity > 0) {
            ctx.shadowColor = customColor;
            ctx.shadowBlur = glowIntensity;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Radial spikes
        for (let i = 0; i < actualBarCount; i++) {
          const angle = (i / actualBarCount) * Math.PI * 2 + phase * 0.08;
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2.2 + i * 0.3) * 0.5 + 0.5) * 0.6 + 0.15;
          }
          const spikeLen = val * (Math.min(width, height) * 0.26) * sensitivity;

          const x1 = centerX + Math.cos(angle) * (baseRadius * 0.95);
          const y1 = centerY + Math.sin(angle) * (baseRadius * 0.95);
          const x2 = centerX + Math.cos(angle) * (baseRadius * 0.95 + spikeLen);
          const y2 = centerY + Math.sin(angle) * (baseRadius * 0.95 + spikeLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? customColor : secondaryColor;
          ctx.lineWidth = Math.max(2, barWidth * 0.55);
          ctx.lineCap = 'round';
          if (glowIntensity > 0) {
            ctx.shadowColor = customColor;
            ctx.shadowBlur = glowIntensity * 0.7;
          }
          ctx.stroke();
        }
      }

      // MODE 2: SPECTRUM FREQUENCY BARS
      else if (currentMode === 'bars') {
        const totalBars = Math.min(barCount, 54);
        const barSpacing = Math.max(3, barWidth * 0.35);
        const totalWidth = width * 0.85;
        const singleWidth = (totalWidth - (totalBars - 1) * barSpacing) / totalBars;
        const startX = (width - totalWidth) / 2;

        for (let i = 0; i < totalBars; i++) {
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2.8 + i * 0.24) * 0.45 + 0.55) * 0.7;
          }
          const maxH = height * 0.42 * sensitivity;
          const barH = Math.max(6, val * maxH);

          const x = startX + i * (singleWidth + barSpacing);
          const y = baseY - barH;

          const grad = ctx.createLinearGradient(x, y, x, baseY);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.25, secondaryColor);
          grad.addColorStop(0.7, customColor);
          grad.addColorStop(1, 'rgba(30, 8, 10, 0.4)');

          ctx.fillStyle = grad;
          if (glowIntensity > 0) {
            ctx.shadowColor = customColor;
            ctx.shadowBlur = glowIntensity * 0.6;
          }
          ctx.beginPath();
          ctx.roundRect(x, y, singleWidth, barH, [4, 4, 0, 0]);
          ctx.fill();
        }
      }

      // MODE 3: MIRROR HORIZON BARS
      else if (currentMode === 'mirror_bars') {
        const totalBars = Math.min(barCount, 48);
        const barSpacing = Math.max(3, barWidth * 0.4);
        const totalWidth = width * 0.86;
        const singleWidth = (totalWidth - (totalBars - 1) * barSpacing) / totalBars;
        const startX = (width - totalWidth) / 2;

        for (let i = 0; i < totalBars; i++) {
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2.2 + i * 0.28) * 0.5 + 0.5) * 0.75;
          }
          const barH = Math.max(4, val * (height * 0.25) * sensitivity);
          const x = startX + i * (singleWidth + barSpacing);

          // Top
          ctx.fillStyle = secondaryColor;
          ctx.beginPath();
          ctx.roundRect(x, baseY - barH, singleWidth, barH, [3, 3, 0, 0]);
          ctx.fill();

          // Bottom reflection
          ctx.fillStyle = customColor;
          ctx.beginPath();
          ctx.roundRect(x, baseY, singleWidth, barH * 0.55, [0, 0, 3, 3]);
          ctx.fill();
        }
      }

      // MODE 4: OSCILLOSCOPE SINE WAVE
      else if (currentMode === 'oscilloscope') {
        ctx.beginPath();
        ctx.lineWidth = Math.max(2, barWidth * 0.6);
        ctx.strokeStyle = customColor;
        if (glowIntensity > 0) {
          ctx.shadowColor = customColor;
          ctx.shadowBlur = glowIntensity;
        }

        const sliceWidth = width / 64;
        let x = 0;

        for (let i = 0; i < 64; i++) {
          let v = (freqData[i] || 0) / 128.0;
          if (!isLiveAudio) {
            v = Math.sin(phase * 4 + i * 0.2) * 0.6 + 1.0;
          }
          const y = (v * (height * 0.18) * sensitivity) + centerY - (height * 0.09);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      // MODE 5: AUDIO PARTICLES
      else if (currentMode === 'particles') {
        particles.forEach((p, idx) => {
          const val = (freqData[idx % 32] || 0) / 255;
          p.x += p.speedX * (1 + val * 2);
          p.y += p.speedY * (1 + val * 2);

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * (1 + val * 1.5), 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? customColor : secondaryColor;
          ctx.fill();
        });
      }

      // MODE 6: 8D ORBITAL WAVES
      else if (currentMode === 'orbit8d') {
        const orbitRadius = Math.min(width, height) * 0.28;
        const orbitAngle = phase * 1.4;
        const ox = centerX + Math.cos(orbitAngle) * orbitRadius;
        const oy = centerY + Math.sin(orbitAngle) * (orbitRadius * 0.45);

        // Core orbital sun
        ctx.beginPath();
        ctx.arc(ox, oy, 16 + bassEnergy * 20, 0, Math.PI * 2);
        ctx.fillStyle = customColor;
        ctx.fill();

        // Rings
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, orbitRadius, orbitRadius * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(234, 56, 56, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // MODE 7: BASS SHOCKWAVE / PULSE RING
      else if (currentMode === 'pulse_ring') {
        const ringCount = 4;
        for (let r = 0; r < ringCount; r++) {
          const rProgress = (phase * 0.6 + r / ringCount) % 1;
          const rRadius = rProgress * Math.min(width, height) * 0.55;
          const rAlpha = (1 - rProgress) * (0.4 + bassEnergy * 0.6);

          ctx.beginPath();
          ctx.arc(centerX, centerY, rRadius, 0, Math.PI * 2);
          ctx.strokeStyle = customColor;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = rAlpha * waveOpacity;
          ctx.stroke();
        }
      }

      // MODE 8: RETRO VU METER
      else if (currentMode === 'cassette_vu') {
        const vuWidth = width * 0.65;
        const vuHeight = 36;
        const vuX = (width - vuWidth) / 2;
        const vuY = baseY;

        ctx.fillStyle = '#180709';
        ctx.fillRect(vuX, vuY, vuWidth, vuHeight);

        const meterWidth = vuWidth * Math.min(1.0, avgEnergy * 1.6 * sensitivity);
        const meterGrad = ctx.createLinearGradient(vuX, vuY, vuX + vuWidth, vuY);
        meterGrad.addColorStop(0, '#10b981');
        meterGrad.addColorStop(0.65, '#f59e0b');
        meterGrad.addColorStop(0.88, '#ea3838');

        ctx.fillStyle = meterGrad;
        ctx.fillRect(vuX + 2, vuY + 2, meterWidth, vuHeight - 4);
      }

      ctx.restore();

      // 3. OVERLAY TYPOGRAPHY & BRANDING
      ctx.save();
      const padX = width * 0.05;

      if (textPosition === 'bottom_left') {
        const textY = height * 0.88;

        // Badge
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = '#ff6b72';
        ctx.fillText(displayBadge.toUpperCase(), padX, textY - 38);

        // Title
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayTitle, padX, textY - 14);

        // Artist
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillStyle = '#d4a2a6';
        ctx.fillText(displayArtist.toUpperCase(), padX, textY + 6);
      } else {
        // Center Stage
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillStyle = '#ff6b72';
        ctx.fillText(displayBadge.toUpperCase(), centerX, height * 0.22);

        ctx.font = '900 26px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayTitle, centerX, height * 0.28);

        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillStyle = '#d4a2a6';
        ctx.fillText(displayArtist.toUpperCase(), centerX, height * 0.33);
      }

      // Watermark
      if (showWatermark) {
        ctx.textAlign = 'right';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillText(watermarkText.toUpperCase(), width - padX, height * 0.07);
      }

      // Floating Kinetic Lyrics
      if (showLyrics) {
        ctx.textAlign = 'center';
        ctx.font = 'italic bold 15px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`“${lyricsText}”`, centerX, height * 0.94);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    dims,
    currentMode,
    wavePos,
    customColor,
    secondaryColor,
    sensitivity,
    barCount,
    barWidth,
    glowIntensity,
    waveOpacity,
    bgImageSrc,
    bgDim,
    bgBlur,
    bassPulseBg,
    showCoverCenter,
    displayTitle,
    displayArtist,
    displayBadge,
    showWatermark,
    watermarkText,
    showLyrics,
    lyricsText,
    textPosition,
    coverUrl,
  ]);

  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      if (onSnapshot) {
        onSnapshot(dataUrl);
      } else {
        const link = document.createElement('a');
        link.download = `${displayTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_720p_thumbnail.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 500);
      }
    } catch (err) {
      console.warn('Snapshot capture warning:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 400);
    }
  };

  return (
    <div className={`relative flex flex-col items-center group w-full ${className}`}>
      {/* Visualizer Canvas Container */}
      <div className={`w-full overflow-hidden rounded-2xl md:rounded-3xl border border-[#3e1719] bg-[#0c0405] shadow-[0_12px_48px_rgba(0,0,0,0.85)] ${dims.styleAspect} flex items-center justify-center max-h-[560px]`}>
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Snapshot quick-button hover badge */}
      <button
        onClick={handleCaptureSnapshot}
        disabled={isExporting}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1c090c]/90 hover:bg-[#ea3838] border border-[#4d1a1d] text-xs font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-95"
        title="Download instant HD thumbnail snapshot"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span>HD Snapshot</span>
      </button>
    </div>
  );
};
