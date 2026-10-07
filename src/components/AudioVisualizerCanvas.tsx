import React, { useEffect, useRef, useState } from 'react';
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
  const glowIntensity = settings?.glowIntensity ?? 16;
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

  // Inform parent of canvas reference for HD video recorder
  useEffect(() => {
    if (onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  // Dimension calculator for true 1080p HD internal canvas resolution
  const getCanvasDimensions = () => {
    switch (currentRatio) {
      case '9:16':
        return { width: 1080, height: 1920, styleAspect: 'aspect-[9/16]' };
      case '1:1':
        return { width: 1080, height: 1080, styleAspect: 'aspect-square' };
      case '16:9':
      default:
        return { width: 1920, height: 1080, styleAspect: 'aspect-video' };
    }
  };

  const dims = getCanvasDimensions();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    // Pre-create floating particle array for particle mode
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * dims.width,
      y: Math.random() * dims.height,
      radius: Math.random() * 4 + 1.5,
      speedX: (Math.random() - 0.5) * 2.5,
      speedY: (Math.random() - 0.5) * 2.5,
      alpha: Math.random() * 0.8 + 0.2,
    }));

    // Preload background image if any
    let bgImg: HTMLImageElement | null = null;
    if (bgImageSrc) {
      bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = bgImageSrc;
    }

    // Preload cover image for central radial
    let coverImg: HTMLImageElement | null = null;
    const coverToLoad = coverUrl || bgImageSrc;
    if (coverToLoad) {
      coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      coverImg.src = coverToLoad;
    }

    const render = () => {
      phase += 0.035;
      const width = canvas.width;
      const height = canvas.height;

      // Extract Web Audio frequency and time-domain data
      const analyser = globalAudioEngine.getAnalyser();
      let freqData: Uint8Array = new Uint8Array(new ArrayBuffer(128));
      let timeData: Uint8Array = new Uint8Array(new ArrayBuffer(128));

      let isLiveAudio = false;
      if (analyser) {
        freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        timeData = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        analyser.getByteFrequencyData(freqData as unknown as Uint8Array<ArrayBuffer>);
        analyser.getByteTimeDomainData(timeData as unknown as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < 40; i++) sum += freqData[i] || 0;
        isLiveAudio = sum > 80;
      }

      // Compute average energy and bass punch
      let bassSum = 0;
      for (let i = 0; i < 8; i++) bassSum += freqData[i] || 0;
      let bassEnergy = bassSum / 8 / 255; // 0 to 1

      let avgEnergy = 0;
      for (let i = 0; i < 32; i++) avgEnergy += freqData[i] || 0;
      avgEnergy = avgEnergy / 32 / 255;

      if (!isLiveAudio) {
        bassEnergy = 0.28 + Math.sin(phase * 2.2) * 0.12;
        avgEnergy = 0.25 + Math.sin(phase * 1.6) * 0.08;
      }

      // 1. BACKGROUND RENDERING
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Bass scale factor for responsive pulse
      const bgScale = bassPulseBg ? 1.0 + bassEnergy * 0.04 : 1.0;
      const bgOffsetX = (width * (1 - bgScale)) / 2;
      const bgOffsetY = (height * (1 - bgScale)) / 2;

      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.save();
        if (bgBlur > 0) {
          ctx.filter = `blur(${bgBlur}px)`;
        }
        ctx.drawImage(bgImg, bgOffsetX, bgOffsetY, width * bgScale, height * bgScale);
        ctx.restore();

        // Dark dim overlay
        if (bgDim > 0) {
          ctx.fillStyle = `rgba(10, 3, 4, ${bgDim})`;
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        // Procedural atmospheric gradient backdrop
        const grad = ctx.createRadialGradient(
          width / 2, height / 2, 80,
          width / 2, height / 2, Math.max(width, height) * 0.75
        );
        grad.addColorStop(0, '#2b0e11');
        grad.addColorStop(0.45, '#180709');
        grad.addColorStop(1, '#090203');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Subtle glowing cyber grid lines in procedural mode
        ctx.save();
        ctx.strokeStyle = 'rgba(234, 56, 56, 0.06)';
        ctx.lineWidth = 1.5;
        const gridStep = 80;
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
        ctx.restore();
      }
      ctx.restore();

      // 2. AUDIO WAVEFORM OVERLAYS
      ctx.save();
      ctx.globalAlpha = waveOpacity;

      // Calculate baseline Y position depending on wavePosition setting
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
        const actualBarCount = Math.max(32, Math.min(96, barCount));

        // Central Cover Circle
        if (showCoverCenter) {
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
            const radGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, baseRadius);
            radGrad.addColorStop(0, customColor);
            radGrad.addColorStop(0.7, '#6b1115');
            radGrad.addColorStop(1, '#1a0608');
            ctx.fillStyle = radGrad;
            ctx.fillRect(centerX - baseRadius, centerY - baseRadius, baseRadius * 2, baseRadius * 2);
          }
          ctx.restore();

          // Glowing perimeter circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * 0.86, 0, Math.PI * 2);
          ctx.strokeStyle = customColor;
          ctx.lineWidth = 4;
          ctx.shadowColor = customColor;
          ctx.shadowBlur = glowIntensity * 1.2;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Radial frequency spikes
        for (let i = 0; i < actualBarCount; i++) {
          const angle = (i / actualBarCount) * Math.PI * 2 + phase * 0.08;
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2.2 + i * 0.3) * 0.5 + 0.5) * 0.6 + 0.15;
          }
          const spikeLen = val * (Math.min(width, height) * 0.28) * sensitivity;

          const x1 = centerX + Math.cos(angle) * (baseRadius * 0.95);
          const y1 = centerY + Math.sin(angle) * (baseRadius * 0.95);
          const x2 = centerX + Math.cos(angle) * (baseRadius * 0.95 + spikeLen);
          const y2 = centerY + Math.sin(angle) * (baseRadius * 0.95 + spikeLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? customColor : secondaryColor;
          ctx.lineWidth = Math.max(2, barWidth * 0.6);
          ctx.lineCap = 'round';
          if (glowIntensity > 0) {
            ctx.shadowColor = customColor;
            ctx.shadowBlur = glowIntensity;
          }
          ctx.stroke();
        }
      }

      // MODE 2: SPECTRUM FREQUENCY BARS
      else if (currentMode === 'bars') {
        const totalBars = Math.min(barCount, 64);
        const barSpacing = Math.max(3, barWidth * 0.4);
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
          grad.addColorStop(0.2, secondaryColor);
          grad.addColorStop(0.7, customColor);
          grad.addColorStop(1, 'rgba(30, 8, 10, 0.4)');

          ctx.fillStyle = grad;
          if (glowIntensity > 0) {
            ctx.shadowColor = customColor;
            ctx.shadowBlur = glowIntensity;
          }
          ctx.beginPath();
          ctx.roundRect(x, y, singleWidth, barH, [6, 6, 0, 0]);
          ctx.fill();

          // High-reflectivity peak cap
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = glowIntensity * 0.8;
          ctx.fillRect(x, y - 4, singleWidth, 3);
        }
      }

      // MODE 3: MIRROR DUAL HORIZON SPECTRUM BARS
      else if (currentMode === 'mirror_bars') {
        const totalBars = Math.min(barCount, 48);
        const totalWidth = width * 0.88;
        const singleWidth = totalWidth / totalBars;
        const startX = (width - totalWidth) / 2;

        for (let i = 0; i < totalBars; i++) {
          let val = (freqData[i * 2] || 0) / 255;
          if (!isLiveAudio) {
            val = (Math.sin(phase * 2.5 + i * 0.2) * 0.45 + 0.55) * 0.65;
          }
          const barH = val * (height * 0.22) * sensitivity;
          const x = startX + i * singleWidth;

          // Top half
          const gradTop = ctx.createLinearGradient(x, centerY - barH, x, centerY);
          gradTop.addColorStop(0, '#ffffff');
          gradTop.addColorStop(0.4, secondaryColor);
          gradTop.addColorStop(1, customColor);
          ctx.fillStyle = gradTop;
          ctx.beginPath();
          ctx.roundRect(x + 2, centerY - barH, singleWidth - 4, barH, [4, 4, 0, 0]);
          ctx.fill();

          // Bottom half (reflection)
          const gradBottom = ctx.createLinearGradient(x, centerY, x, centerY + barH);
          gradBottom.addColorStop(0, customColor);
          gradBottom.addColorStop(0.8, secondaryColor);
          gradBottom.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
          ctx.fillStyle = gradBottom;
          ctx.beginPath();
          ctx.roundRect(x + 2, centerY, singleWidth - 4, barH, [0, 0, 4, 4]);
          ctx.fill();
        }

        // Center horizon laser line
        ctx.beginPath();
        ctx.moveTo(startX - 20, centerY);
        ctx.lineTo(startX + totalWidth + 20, centerY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = customColor;
        ctx.shadowBlur = 18;
        ctx.stroke();
      }

      // MODE 4: FLUID NEON SINE OSCILLOSCOPE
      else if (currentMode === 'oscilloscope') {
        ctx.beginPath();
        ctx.lineWidth = barWidth * 0.8 + 2;
        ctx.strokeStyle = customColor;
        ctx.shadowColor = customColor;
        ctx.shadowBlur = glowIntensity * 1.5;

        const sliceWidth = width / 128;
        let x = 0;

        for (let i = 0; i < 128; i++) {
          let v = (timeData[i] || 128) / 128.0;
          if (!isLiveAudio) {
            v = 1.0 + Math.sin(phase * 3.2 + i * 0.15) * 0.3 * Math.cos(phase + i * 0.06);
          }
          const y = centerY + (v - 1.0) * (height * 0.45 * sensitivity);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

        // Second harmonic glow wave
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = glowIntensity;
        x = 0;
        for (let i = 0; i < 128; i++) {
          let v = (timeData[i] || 128) / 128.0;
          if (!isLiveAudio) {
            v = 1.0 + Math.sin(phase * 3.2 + i * 0.15) * 0.3 * Math.cos(phase + i * 0.06);
          }
          const y = centerY + (v - 1.0) * (height * 0.45 * sensitivity);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      // MODE 5: FLOATING PARTICLES COSMOS
      else if (currentMode === 'particles') {
        particles.forEach((p, idx) => {
          p.x += p.speedX * (1 + bassEnergy * 2.5);
          p.y += p.speedY * (1 + bassEnergy * 2.5);

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const val = (freqData[idx % 30] || 0) / 255;
          const currentRadius = p.radius * (1 + (isLiveAudio ? val * 3.2 : avgEnergy * 1.5)) * sensitivity;

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = idx % 4 === 0 ? '#ffffff' : idx % 2 === 0 ? secondaryColor : customColor;
          if (glowIntensity > 0) {
            ctx.shadowColor = customColor;
            ctx.shadowBlur = glowIntensity * 0.8;
          }
          ctx.fill();
        });
      }

      // MODE 6: 8D ORBIT WAVES (SPATIAL LFO PANNING)
      else if (currentMode === 'orbit8d') {
        const orbitOffset = Math.sin(phase * 1.5) * (width * 0.25);
        const orbitX = centerX + orbitOffset;
        const orbitRadius = Math.min(width, height) * 0.24 * (1 + bassEnergy * 0.2);

        // Orbital Ring 1
        ctx.beginPath();
        ctx.ellipse(orbitX, centerY, orbitRadius * 1.4, orbitRadius * 0.6, phase * 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = customColor;
        ctx.lineWidth = 4.5;
        ctx.shadowColor = customColor;
        ctx.shadowBlur = glowIntensity * 1.3;
        ctx.stroke();

        // Orbital Ring 2 (counter-rotating)
        ctx.beginPath();
        ctx.ellipse(centerX - orbitOffset * 0.7, centerY, orbitRadius * 1.1, orbitRadius * 0.75, -phase * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 3.5;
        ctx.shadowColor = secondaryColor;
        ctx.stroke();

        // Central 8D Sound Sphere
        ctx.beginPath();
        ctx.arc(orbitX, centerY, 18 + bassEnergy * 22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = glowIntensity * 2;
        ctx.fill();

        // 8D Spatial Pan Indicator Line
        ctx.beginPath();
        ctx.moveTo(width * 0.2, height * 0.92);
        ctx.lineTo(width * 0.8, height * 0.92);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();

        const sliderDotX = centerX + orbitOffset * 1.2;
        ctx.beginPath();
        ctx.arc(sliderDotX, height * 0.92, 10, 0, Math.PI * 2);
        ctx.fillStyle = customColor;
        ctx.fill();
      }

      // MODE 7: BASS SHOCKWAVE PULSE RING
      else if (currentMode === 'pulse_ring') {
        const ringCount = 5;
        for (let r = 0; r < ringCount; r++) {
          const ringProgress = (phase * 0.8 + r / ringCount) % 1.0;
          const ringRad = ringProgress * (Math.min(width, height) * 0.65) * (1 + bassEnergy * 0.3);
          const ringAlpha = (1.0 - ringProgress) * (0.8 + bassEnergy * 0.2);

          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRad, 0, Math.PI * 2);
          ctx.strokeStyle = r % 2 === 0 ? customColor : secondaryColor;
          ctx.globalAlpha = Math.max(0, ringAlpha * waveOpacity);
          ctx.lineWidth = 4 + (1 - ringProgress) * 6;
          ctx.shadowColor = customColor;
          ctx.shadowBlur = glowIntensity * 1.5;
          ctx.stroke();
        }

        // Inner core
        ctx.globalAlpha = waveOpacity;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35 + bassEnergy * 45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = glowIntensity * 2;
        ctx.fill();
      }

      // MODE 8: RETRO CASSETTE VU METERS
      else if (currentMode === 'cassette_vu') {
        const vuWidth = width * 0.36;
        const vuHeight = 44;
        const leftX = width * 0.12;
        const rightX = width * 0.52;
        const vuY = baseY - 20;

        // Left channel VU
        const leftVal = (freqData[6] || 0) / 255;
        const rightVal = (freqData[14] || 0) / 255;

        // Backing
        ctx.fillStyle = 'rgba(10, 3, 4, 0.85)';
        ctx.strokeStyle = '#3e1618';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftX, vuY, vuWidth, vuHeight);
        ctx.fillRect(leftX, vuY, vuWidth, vuHeight);
        ctx.strokeRect(rightX, vuY, vuWidth, vuHeight);
        ctx.fillRect(rightX, vuY, vuWidth, vuHeight);

        // Fill left
        ctx.fillStyle = customColor;
        ctx.fillRect(leftX + 4, vuY + 4, (vuWidth - 8) * leftVal * sensitivity, vuHeight - 8);

        // Fill right
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(rightX + 4, vuY + 4, (vuWidth - 8) * rightVal * sensitivity, vuHeight - 8);

        // Text labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 16px "Space Grotesk", sans-serif';
        ctx.fillText('L CHANNEL VU', leftX + 12, vuY - 10);
        ctx.fillText('R CHANNEL VU (8D)', rightX + 12, vuY - 10);
      }

      ctx.restore();

      // 3. TYPOGRAPHY, BADGES & BRANDING OVERLAYS
      ctx.save();

      // Top corner badge
      const tagText = displayBadge;
      ctx.font = '700 18px "Space Grotesk", sans-serif';
      const textWidth = ctx.measureText(tagText).width;

      ctx.fillStyle = 'rgba(20, 6, 8, 0.88)';
      ctx.strokeStyle = customColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(42, 42, textWidth + 34, 44, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, 58, 70);

      // Main Title and Artist Typography
      if (textPosition === 'center') {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px "Plus Jakarta Sans", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 18;
        ctx.fillText(displayTitle, width / 2, height * 0.38);

        ctx.fillStyle = secondaryColor;
        ctx.font = '700 28px "Space Grotesk", sans-serif';
        ctx.fillText(displayArtist, width / 2, height * 0.43);
      } else {
        // Bottom left default
        const titleY = height - 110;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 44px "Plus Jakarta Sans", sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 16;
        ctx.fillText(displayTitle, 46, titleY);

        ctx.fillStyle = secondaryColor;
        ctx.font = '700 24px "Space Grotesk", sans-serif';
        ctx.fillText(`${displayArtist} • 44.1kHz Hi-Res Master`, 46, titleY + 40);
      }

      // Watermark
      if (showWatermark) {
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '700 16px "Space Grotesk", sans-serif';
        ctx.fillText(watermarkText, width - 42, 68);

        // Pulsing audio reactive indicator dot
        ctx.beginPath();
        ctx.arc(width - 24, 63, 6 + bassEnergy * 6, 0, Math.PI * 2);
        ctx.fillStyle = customColor;
        ctx.shadowColor = customColor;
        ctx.shadowBlur = 12;
        ctx.fill();
      }

      // Synced Kinetic Lyrics Overlay
      if (showLyrics && lyricsText) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(15, 4, 6, 0.85)';
        ctx.strokeStyle = '#4e1b1f';
        ctx.lineWidth = 2;
        const lyrMetrics = ctx.measureText(lyricsText);
        const lyrW = Math.max(300, lyrMetrics.width + 80);
        const lyrH = 54;
        const lyrX = (width - lyrW) / 2;
        const lyrY = height * 0.24;

        ctx.beginPath();
        ctx.roundRect(lyrX, lyrY, lyrW, lyrH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
        ctx.shadowColor = customColor;
        ctx.shadowBlur = 10;
        ctx.fillText(`“${lyricsText}”`, width / 2, lyrY + 34);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    currentMode,
    currentRatio,
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
    dims.width,
    dims.height,
  ]);

  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (onSnapshot) {
      onSnapshot(dataUrl);
    } else {
      const link = document.createElement('a');
      link.download = `${displayTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080p_thumbnail.png`;
      link.href = dataUrl;
      link.click();
    }
    setTimeout(() => setIsExporting(false), 400);
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
        title="Download instant 1080p thumbnail snapshot"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span>HD Snapshot</span>
      </button>
    </div>
  );
};
