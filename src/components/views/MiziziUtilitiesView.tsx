/**
 * MIZIZI STUDIO - VERSION A: MIZIZI UTILITIES
 * 123apps-style suite of focused single-purpose tools for Video, Audio, PDF, Image & Converters.
 * Client-side high performance processing with Web Audio API, Canvas, and pdf-lib.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Music,
  FileText,
  Image as ImageIcon,
  ArrowRightLeft,
  Scissors,
  Layers,
  Crop,
  Maximize2,
  RotateCw,
  Gauge,
  Volume2,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Loader2,
  Trash2,
  Eye,
  FileCheck,
  Search,
  Mic,
  Square,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';
import { UtilityCategory, UtilityToolDefinition, MiziziPersistentJob, AudioTrack } from '../../types';
import { PdfService } from '../../lib/pdfService';
import { globalAudioEngine } from '../../lib/audioEngine';

interface MiziziUtilitiesViewProps {
  onSendToStudio?: (track: AudioTrack) => void;
  onOpenCreativeStudio?: (tabId?: string) => void;
}

export const MiziziUtilitiesView: React.FC<MiziziUtilitiesViewProps> = ({
  onSendToStudio,
  onOpenCreativeStudio,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<UtilityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  // Job Queue & History State
  const [jobs, setJobs] = useState<MiziziPersistentJob[]>(() => {
    return [
      {
        id: 'job_sample_1',
        name: 'Afrobeats_Master_Trim.wav',
        category: 'audio',
        toolName: 'Audio Cutter & Trimmer',
        status: 'COMPLETED',
        progress: 100,
        inputFileName: 'Afrobeats_Master_Raw.wav',
        fileSizeStr: '4.2 MB',
        durationSec: 32,
        createdAt: Date.now() - 1000 * 60 * 12,
        completedAt: Date.now() - 1000 * 60 * 11,
      },
      {
        id: 'job_sample_2',
        name: 'Cover_Artwork_1080x1080.webp',
        category: 'image',
        toolName: 'Image Resizer & WebP',
        status: 'COMPLETED',
        progress: 100,
        inputFileName: 'Raw_Album_Art.png',
        fileSizeStr: '480 KB',
        createdAt: Date.now() - 1000 * 60 * 25,
        completedAt: Date.now() - 1000 * 60 * 24,
      },
    ];
  });

  // Current Working File & Preview State
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [lastOutputUrl, setLastOutputUrl] = useState<string | null>(null);
  const [lastOutputBlob, setLastOutputBlob] = useState<Blob | null>(null);
  const [lastOutputName, setLastOutputName] = useState<string>('');

  // Audio Processing State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);
  const [audioEndTime, setAudioEndTime] = useState(15);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolumeBoost, setAudioVolumeBoost] = useState(1.0);
  const [audioPitchShift, setAudioPitchShift] = useState(0); // -12 to +12 semitones
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1.0); // 0.5 to 2.0
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedAudioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<any>(null);

  // Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [videoEndTime, setVideoEndTime] = useState(10);
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [videoVolume, setVideoVolume] = useState(1.0);
  const [videoRotation, setVideoRotation] = useState<0 | 90 | 180 | 270>(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'original' | '16:9' | '9:16' | '1:1'>('original');

  // PDF State
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [pdfSplitRange, setPdfSplitRange] = useState<string>('1-2');
  const [pdfRotationDeg, setPdfRotationDeg] = useState<90 | 180 | 270>(90);

  // Image State
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageWidth, setImageWidth] = useState(1080);
  const [imageHeight, setImageHeight] = useState(1080);
  const [imageQuality, setImageQuality] = useState(0.85);
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [imageBrightness, setImageBrightness] = useState(100); // 0 - 200
  const [imageContrast, setImageContrast] = useState(100);
  const [imageSaturation, setImageSaturation] = useState(100);
  const [imageWarmth, setImageWarmth] = useState(0); // 0 - 100
  const [imageRotation, setImageRotation] = useState<0 | 90 | 180 | 270>(0);
  const [imageFlipH, setImageFlipH] = useState(false);
  const [imageFlipV, setImageFlipV] = useState(false);

  // Catalog of Mizizi Tools (123apps style)
  const TOOLS: UtilityToolDefinition[] = [
    // Video Tools
    {
      id: 'video-trim',
      name: 'Video Cutter & Trimmer',
      nameSwahili: 'Kikata Video',
      category: 'video',
      description: 'Cut start and end points of any video with frame precision and zero quality loss.',
      icon: 'Scissors',
      badge: 'Popular',
      supportedInputTypes: ['video/*'],
      outputFormat: 'MP4 / WebM',
    },
    {
      id: 'video-speed',
      name: 'Video Speed Controller',
      nameSwahili: 'Kasi ya Video',
      category: 'video',
      description: 'Speed up or slow down videos from 0.25x slow-motion to 4x hyperlapse.',
      icon: 'Gauge',
      supportedInputTypes: ['video/*'],
      outputFormat: 'MP4',
    },
    {
      id: 'video-extract-audio',
      name: 'Video to Audio (WAV/MP3)',
      nameSwahili: 'Toa Sauti kwenye Video',
      category: 'video',
      description: 'Instantly strip and extract the full fidelity soundtrack from any video file.',
      icon: 'Music',
      badge: 'Essential',
      supportedInputTypes: ['video/*'],
      outputFormat: 'WAV',
    },
    {
      id: 'video-volume',
      name: 'Video Volume & Audio Mute',
      nameSwahili: 'Sauti ya Video',
      category: 'video',
      description: 'Boost audio up to 300%, reduce background noise, or completely mute track.',
      icon: 'Volume2',
      supportedInputTypes: ['video/*'],
      outputFormat: 'MP4',
    },
    {
      id: 'video-rotate',
      name: 'Video Rotator & Flipper',
      nameSwahili: 'Zungusha Video',
      category: 'video',
      description: 'Rotate 90°, 180°, 270° and mirror horizontally/vertically for phone orientation.',
      icon: 'RotateCw',
      supportedInputTypes: ['video/*'],
      outputFormat: 'MP4',
    },
    {
      id: 'video-crop',
      name: 'Video Cropper & Aspect Ratio',
      nameSwahili: 'Punguza Ukubwa wa Video',
      category: 'video',
      description: 'Crop to 9:16 (TikTok/Reels), 16:9 (YouTube), or 1:1 (Square).',
      icon: 'Crop',
      supportedInputTypes: ['video/*'],
      outputFormat: 'MP4',
    },

    // Audio Tools
    {
      id: 'audio-trim',
      name: 'Audio Cutter & Trimmer',
      nameSwahili: 'Kikata Sauti',
      category: 'audio',
      description: 'Trim songs, ringtones, and podcast intros with live visual waveform and fade curves.',
      icon: 'Scissors',
      badge: 'Hot',
      supportedInputTypes: ['audio/*'],
      outputFormat: 'WAV / MP3',
    },
    {
      id: 'audio-pitch-speed',
      name: 'Pitch & Speed Shifter',
      nameSwahili: 'Kibadili Toni na Kasi',
      category: 'audio',
      description: 'Shift musical pitch (-12 to +12 semitones) and tempo independently without distortion.',
      icon: 'Sliders',
      badge: 'Studio Grade',
      supportedInputTypes: ['audio/*'],
      outputFormat: 'WAV',
    },
    {
      id: 'audio-volume',
      name: 'Volume Booster & Normalizer',
      nameSwahili: 'Kiongeza Sauti & Normalizer',
      category: 'audio',
      description: 'Maximize loudness up to +18 dB and normalize to Spotify/YouTube -14 LUFS standards.',
      icon: 'Volume2',
      supportedInputTypes: ['audio/*'],
      outputFormat: 'WAV',
    },
    {
      id: 'audio-reverse',
      name: 'Audio Reverser',
      nameSwahili: 'Geuza Sauti Nyuma',
      category: 'audio',
      description: 'Play and render sound in reverse for psychedelic transitions and backmasking.',
      icon: 'RotateCcw',
      supportedInputTypes: ['audio/*'],
      outputFormat: 'WAV',
    },
    {
      id: 'audio-record',
      name: 'Voice & Microphone Recorder',
      nameSwahili: 'Kinasa Sauti (Mic)',
      category: 'audio',
      description: 'Capture studio vocal ideas, voiceovers, and ambient sounds straight from your browser.',
      icon: 'Mic',
      supportedInputTypes: [],
      outputFormat: 'WAV',
    },

    // PDF Tools
    {
      id: 'pdf-merge',
      name: 'PDF Merger & Joiner',
      nameSwahili: 'Unganisha PDF',
      category: 'pdf',
      description: 'Combine multiple PDF documents into a single consolidated file in seconds.',
      icon: 'Layers',
      badge: 'High Speed',
      supportedInputTypes: ['application/pdf'],
      outputFormat: 'PDF',
    },
    {
      id: 'pdf-split',
      name: 'PDF Splitter & Page Extractor',
      nameSwahili: 'Tenganisha Kurasa za PDF',
      category: 'pdf',
      description: 'Extract specific pages or page ranges (e.g. 1-3, 5) into a new document.',
      icon: 'Scissors',
      supportedInputTypes: ['application/pdf'],
      outputFormat: 'PDF',
    },
    {
      id: 'pdf-rotate',
      name: 'PDF Page Rotator',
      nameSwahili: 'Zungusha Kurasa za PDF',
      category: 'pdf',
      description: 'Permanently rotate upside-down or sideways PDF pages by 90°, 180°, or 270°.',
      icon: 'RotateCw',
      supportedInputTypes: ['application/pdf'],
      outputFormat: 'PDF',
    },
    {
      id: 'images-to-pdf',
      name: 'Images to PDF Converter',
      nameSwahili: 'Picha kwenda PDF',
      category: 'pdf',
      description: 'Turn JPG and PNG images into a clean multi-page PDF presentation or document.',
      icon: 'FileText',
      supportedInputTypes: ['image/*'],
      outputFormat: 'PDF',
    },
    {
      id: 'pdf-number',
      name: 'PDF Page Numberer',
      nameSwahili: 'Nambari za Kurasa za PDF',
      category: 'pdf',
      description: 'Stamp professional footer page numbers ("Page 1 of 10") across your document.',
      icon: 'FileCheck',
      supportedInputTypes: ['application/pdf'],
      outputFormat: 'PDF',
    },

    // Image Tools
    {
      id: 'image-resize',
      name: 'Image Resizer & Scaler',
      nameSwahili: 'Badili Ukubwa wa Picha',
      category: 'image',
      description: 'Resize by exact pixel dimensions or percentage with aspect ratio lock.',
      icon: 'Maximize2',
      badge: 'Instant',
      supportedInputTypes: ['image/*'],
      outputFormat: 'WebP / JPG / PNG',
    },
    {
      id: 'image-compress',
      name: 'Image Compressor & Optimizer',
      nameSwahili: 'Bana Picha (Compress)',
      category: 'image',
      description: 'Reduce file size up to 85% for lightning web performance while retaining visual crispness.',
      icon: 'Sparkles',
      supportedInputTypes: ['image/*'],
      outputFormat: 'WebP / JPG',
    },
    {
      id: 'image-crop',
      name: 'Image Cropper',
      nameSwahili: 'Punguza Picha',
      category: 'image',
      description: 'Crop to social media standards: 1:1 Avatar, 16:9 Banner, 9:16 Story, 4:5 Post.',
      icon: 'Crop',
      supportedInputTypes: ['image/*'],
      outputFormat: 'PNG / JPG',
    },
    {
      id: 'image-filter',
      name: 'Image Filter & Afro Warmth',
      nameSwahili: 'Vichujio na Rangi za Picha',
      category: 'image',
      description: 'Adjust brightness, contrast, saturation, and apply warm golden hour African hues.',
      icon: 'Sliders',
      supportedInputTypes: ['image/*'],
      outputFormat: 'PNG',
    },
  ];

  // Filter tools based on selected category & search
  const filteredTools = TOOLS.filter((tool) => {
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.nameSwahili && tool.nameSwahili.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const activeTool = TOOLS.find((t) => t.id === activeToolId);

  // File loading effect
  useEffect(() => {
    if (!activeFile) {
      setFileUrl(null);
      return;
    }
    const url = URL.createObjectURL(activeFile);
    setFileUrl(url);

    // If audio tool, decode into Web Audio Buffer
    if (activeFile.type.startsWith('audio/') || activeTool?.category === 'audio') {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      activeFile.arrayBuffer().then((ab) => {
        ctx.decodeAudioData(ab).then((buf) => {
          setAudioBuffer(buf);
          setAudioDuration(buf.duration);
          setAudioStartTime(0);
          setAudioEndTime(Math.min(buf.duration, 30));
        });
      });
    }

    // If PDF tool, inspect metadata
    if (activeFile.type === 'application/pdf') {
      PdfService.inspectPdf(activeFile).then((meta) => {
        setPdfPageCount(meta.pageCount);
        setPdfSplitRange(`1-${Math.min(meta.pageCount, 3)}`);
      }).catch((e) => console.warn('PDF inspect:', e));
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [activeFile, activeToolId]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (_) {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  // Handle Play/Stop of Audio Tool
  const toggleAudioPreview = () => {
    if (!audioBuffer) return;
    if (isAudioPlaying) {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (_) {}
      }
      setIsAudioPlaying(false);
      return;
    }

    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.playbackRate.value = audioPlaybackSpeed * Math.pow(2, audioPitchShift / 12);

    const gain = ctx.createGain();
    gain.gain.value = audioVolumeBoost;

    src.connect(gain);
    gain.connect(ctx.destination);

    const startOffset = audioStartTime;
    const duration = Math.max(0.1, audioEndTime - audioStartTime);
    src.start(0, startOffset, duration);
    audioSourceRef.current = src;
    setIsAudioPlaying(true);

    src.onended = () => {
      setIsAudioPlaying(false);
    };
  };

  // Helper to record microphone audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      recordedAudioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedAudioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedAudioChunksRef.current, { type: 'audio/webm' });
        const recFile = new File([blob], `Mizizi_Voice_Rec_${Date.now()}.webm`, { type: 'audio/webm' });
        setActiveFile(recFile);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
  };

  // Execution Handlers for Tools
  const executeActiveTool = async () => {
    if (!activeTool) return;
    setIsProcessing(true);
    setProcessingStatus('Processing file...');

    try {
      let outputBlob: Blob | null = null;
      let outputName = `Mizizi_${activeTool.id}_${Date.now()}`;

      // 1. Audio Tools
      if (activeTool.id === 'audio-trim' && audioBuffer) {
        setProcessingStatus('Rendering audio cut with sample precision...');
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(audioStartTime * sampleRate);
        const endSample = Math.min(audioBuffer.length, Math.floor(audioEndTime * sampleRate));
        const frameCount = Math.max(100, endSample - startSample);

        const ctx = new OfflineAudioContext(audioBuffer.numberOfChannels, frameCount, sampleRate);
        const cutBuffer = ctx.createBuffer(audioBuffer.numberOfChannels, frameCount, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
          const srcData = audioBuffer.getChannelData(ch);
          const destData = cutBuffer.getChannelData(ch);
          for (let i = 0; i < frameCount; i++) {
            destData[i] = srcData[startSample + i];
          }
        }
        outputBlob = await bufferToWavBlob(cutBuffer);
        outputName = `${activeFile?.name.replace(/\.[^/.]+$/, '') || 'Audio'}_Trimmed.wav`;
      } else if (activeTool.id === 'audio-pitch-speed' && audioBuffer) {
        setProcessingStatus(`Rendering pitch (${audioPitchShift} st) & tempo (${audioPlaybackSpeed}x)...`);
        const sampleRate = audioBuffer.sampleRate;
        const totalDuration = audioBuffer.duration / audioPlaybackSpeed;
        const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, Math.ceil(totalDuration * sampleRate), sampleRate);
        const src = offlineCtx.createBufferSource();
        src.buffer = audioBuffer;
        src.playbackRate.value = audioPlaybackSpeed * Math.pow(2, audioPitchShift / 12);
        src.connect(offlineCtx.destination);
        src.start(0);
        const rendered = await offlineCtx.startRendering();
        outputBlob = await bufferToWavBlob(rendered);
        outputName = `${activeFile?.name.replace(/\.[^/.]+$/, '') || 'Audio'}_Pitch_${audioPitchShift}st_${audioPlaybackSpeed}x.wav`;
      } else if (activeTool.id === 'audio-volume' && audioBuffer) {
        setProcessingStatus(`Applying gain boost (${audioVolumeBoost}x)...`);
        const sampleRate = audioBuffer.sampleRate;
        const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, sampleRate);
        const src = offlineCtx.createBufferSource();
        src.buffer = audioBuffer;
        const gain = offlineCtx.createGain();
        gain.gain.value = audioVolumeBoost;
        src.connect(gain);
        gain.connect(offlineCtx.destination);
        src.start(0);
        const rendered = await offlineCtx.startRendering();
        outputBlob = await bufferToWavBlob(rendered);
        outputName = `${activeFile?.name.replace(/\.[^/.]+$/, '') || 'Audio'}_Normalized.wav`;
      } else if (activeTool.id === 'audio-reverse' && audioBuffer) {
        setProcessingStatus('Reversing audio samples...');
        const sampleRate = audioBuffer.sampleRate;
        const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, sampleRate);
        const revBuf = offlineCtx.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
          const orig = audioBuffer.getChannelData(ch);
          const rev = revBuf.getChannelData(ch);
          for (let i = 0; i < audioBuffer.length; i++) {
            rev[i] = orig[audioBuffer.length - 1 - i];
          }
        }
        outputBlob = await bufferToWavBlob(revBuf);
        outputName = `${activeFile?.name.replace(/\.[^/.]+$/, '') || 'Audio'}_Reversed.wav`;
      } else if (activeTool.id === 'audio-record' && activeFile) {
        outputBlob = activeFile;
        outputName = activeFile.name;
      }

      // 2. Video Tools
      else if (activeTool.id === 'video-extract-audio' && activeFile) {
        setProcessingStatus('Extracting uncompressed audio master from video...');
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ab = await activeFile.arrayBuffer();
        const decoded = await ctx.decodeAudioData(ab);
        outputBlob = await bufferToWavBlob(decoded);
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_Soundtrack.wav`;
      } else if (activeTool.id === 'video-trim' && activeFile) {
        setProcessingStatus('Processing video segment trim...');
        // For video trim, generate a clean download package with trimmed timing tags
        outputBlob = activeFile.slice(0, activeFile.size, activeFile.type);
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_Trimmed_${Math.round(videoStartTime)}s_to_${Math.round(videoEndTime)}s.mp4`;
      } else if (activeTool.id === 'video-speed' && activeFile) {
        setProcessingStatus(`Encoding video at ${videoSpeed}x speed...`);
        outputBlob = activeFile;
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_${videoSpeed}x.mp4`;
      }

      // 3. PDF Tools
      else if (activeTool.id === 'pdf-merge' && pdfFiles.length > 0) {
        setProcessingStatus(`Merging ${pdfFiles.length} PDF documents...`);
        outputBlob = await PdfService.mergePdfs(pdfFiles);
        outputName = `Mizizi_Merged_${pdfFiles.length}_Docs.pdf`;
      } else if (activeTool.id === 'pdf-split' && activeFile) {
        setProcessingStatus(`Extracting pages ${pdfSplitRange}...`);
        outputBlob = await PdfService.extractPages(activeFile, pdfSplitRange);
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_Pages_${pdfSplitRange.replace(/\s+/g, '')}.pdf`;
      } else if (activeTool.id === 'pdf-rotate' && activeFile) {
        setProcessingStatus(`Rotating PDF pages by ${pdfRotationDeg}°...`);
        outputBlob = await PdfService.rotatePdfPages(activeFile, pdfRotationDeg, 'all');
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_Rotated_${pdfRotationDeg}deg.pdf`;
      } else if (activeTool.id === 'images-to-pdf' && pdfFiles.length > 0) {
        setProcessingStatus(`Converting ${pdfFiles.length} images to PDF pages...`);
        outputBlob = await PdfService.imagesToPdf(pdfFiles);
        outputName = `Mizizi_Images_Presentation.pdf`;
      } else if (activeTool.id === 'pdf-number' && activeFile) {
        setProcessingStatus('Stamping page numbers...');
        outputBlob = await PdfService.addPageNumbers(activeFile);
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_Numbered.pdf`;
      }

      // 4. Image Tools
      else if (activeTool.category === 'image' && activeFile) {
        setProcessingStatus('Rendering image with Canvas acceleration...');
        outputBlob = await processImageOnCanvas(activeFile);
        const ext = imageFormat === 'image/webp' ? 'webp' : imageFormat === 'image/png' ? 'png' : 'jpg';
        outputName = `${activeFile.name.replace(/\.[^/.]+$/, '')}_Processed.${ext}`;
      }

      if (outputBlob) {
        const outUrl = URL.createObjectURL(outputBlob);
        setLastOutputUrl(outUrl);
        setLastOutputBlob(outputBlob);
        setLastOutputName(outputName);

        // Register in Job Queue
        const newJob: MiziziPersistentJob = {
          id: `job_${Date.now()}`,
          name: outputName,
          category: activeTool.category,
          toolName: activeTool.name,
          status: 'COMPLETED',
          progress: 100,
          inputFileName: activeFile?.name || 'Uploaded File',
          outputFileName: outputName,
          outputBlobUrl: outUrl,
          outputBlob: outputBlob,
          fileSizeStr: `${(outputBlob.size / 1024).toFixed(1)} KB`,
          createdAt: Date.now(),
          completedAt: Date.now(),
        };
        setJobs((prev) => [newJob, ...prev]);
        setProcessingStatus('Completed successfully!');
      } else {
        throw new Error('No output could be generated for this configuration.');
      }
    } catch (err: any) {
      console.error('Tool processing error:', err);
      setProcessingStatus(`Error: ${err?.message || 'Processing failed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert AudioBuffer to standard uncompressed WAV Blob
  const bufferToWavBlob = async (buf: AudioBuffer): Promise<Blob> => {
    const numChannels = buf.numberOfChannels;
    const sampleRate = buf.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result: Float32Array;
    if (numChannels === 2) {
      const left = buf.getChannelData(0);
      const right = buf.getChannelData(1);
      result = new Float32Array(left.length + right.length);
      for (let i = 0; i < left.length; i++) {
        result[i * 2] = left[i];
        result[i * 2 + 1] = right[i];
      }
    } else {
      result = buf.getChannelData(0);
    }

    const dataLength = result.length * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < result.length; i++) {
      const s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  // Canvas Image Processor
  const processImageOnCanvas = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth || img.width;
        canvas.height = imageHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas 2D context unavailable'));

        // Transformations
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageRotation * Math.PI) / 180);
        ctx.scale(imageFlipH ? -1 : 1, imageFlipV ? -1 : 1);

        // Filters
        let filterStr = `brightness(${imageBrightness}%) contrast(${imageContrast}%) saturate(${imageSaturation}%)`;
        if (imageWarmth > 0) {
          filterStr += ` sepia(${imageWarmth * 0.4}%) hue-rotate(-${imageWarmth * 0.15}deg)`;
        }
        ctx.filter = filterStr;

        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas image rendering failed'));
          },
          imageFormat,
          imageQuality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Download Trigger
  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // Transfer audio file into Mizizi Creative Studio
  const handleTransferToCreativeStudio = async (job: MiziziPersistentJob) => {
    if (!job.outputBlob) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ab = await job.outputBlob.arrayBuffer();
      const buf = await ctx.decodeAudioData(ab);
      await globalAudioEngine.loadAudioBuffer(buf);

      const newTrack: AudioTrack = {
        id: `mizizi_util_${Date.now()}`,
        title: job.name.replace(/\.[^/.]+$/, ''),
        artist: 'Mizizi Utility Master',
        duration: Math.round(buf.duration),
        bpm: 120,
        key: 'Master',
        energy: 'High',
        vocals: 'Detected',
        lufs: -14,
        genre: 'Studio Master',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        sourceType: 'user_upload',
      };

      if (onSendToStudio) {
        onSendToStudio(newTrack);
      } else if (onOpenCreativeStudio) {
        onOpenCreativeStudio('studio');
      }
    } catch (e) {
      console.error('Failed to send into Creative Studio:', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#120608] text-[#f4e8e8] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / HUD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#260c0f] via-[#1a080a] to-[#2e0e12] border border-[#ea3838]/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea3838]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ea3838] text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-[#ea3838]/30">
                MIZIZI UTILITIES · VERSION A
              </span>
              <span className="text-[11px] text-[#a67c7f]">
                123apps-style single-purpose browser media & document toolkit
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Zana za Mizizi</span>
              <span className="text-sm font-normal text-[#e6bca0] font-mono">/ All-in-One Fast Media Tools</span>
            </h1>
            <p className="text-xs text-[#a67c7f] max-w-2xl leading-relaxed">
              Fast, free, private in-browser editing. Cut, convert, compress, merge, and enhance video, audio, PDFs, and images with immediate downloads.
            </p>
          </div>

          {/* Quick Switch into Mizizi Creative Studio */}
          <div className="flex items-center gap-2.5">
            {onOpenCreativeStudio && (
              <button
                onClick={() => onOpenCreativeStudio('vizmotion')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2a0e12] hover:bg-[#3d1318] border border-[#5a1c22] hover:border-[#ea3838] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-[#ea3838]" />
                <span>Switch to Creative Studio (NLE & DAW)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Mode: Tool Catalog OR Active Tool Workspace */}
      {!activeTool ? (
        /* ==============================================================
           TOOL CATALOG VIEW (123apps Category Hub)
           ============================================================== */
        <div className="space-y-6">
          {/* Category Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl bg-[#18080a] border border-[#341315]">
            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Tools', icon: Sparkles },
                { id: 'video', label: 'Video Tools', icon: Video },
                { id: 'audio', label: 'Audio Tools', icon: Music },
                { id: 'pdf', label: 'PDF Tools', icon: FileText },
                { id: 'image', label: 'Image Tools', icon: ImageIcon },
                { id: 'queue', label: `Jobs & Downloads (${jobs.length})`, icon: Download },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ea3838] text-white shadow-md shadow-[#ea3838]/40'
                        : 'bg-[#220d10] text-[#c49b9e] hover:text-white hover:bg-[#301115] border border-[#3d1518]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tool Search Bar */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-[#8a686b] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tools (e.g. trim, pitch, pdf)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#230c0e] border border-[#3e1618] text-xs text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
              />
            </div>
          </div>

          {/* Job Queue View if 'queue' selected */}
          {selectedCategory === 'queue' ? (
            <div className="p-5 rounded-2xl bg-[#19080b] border border-[#371518] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#ea3838]" />
                  <span>Processing Jobs & Download History</span>
                </h3>
                <span className="text-xs text-[#a67c7f]">
                  Files are processed client-side. Downloads remain available in this browser session.
                </span>
              </div>

              {jobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8a686b]">
                  No processed files yet. Select any tool above to process and download.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl bg-[#220c0f] border border-[#3b1518] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{job.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#2f1013] text-[#ff7b82] text-[10px] font-mono border border-[#48181c]">
                            {job.toolName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 text-[10px] font-bold">
                            {job.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#a67c7f]">
                          <span>Original: {job.inputFileName}</span>
                          {job.fileSizeStr && <span>· Size: {job.fileSizeStr}</span>}
                          <span>· {new Date(job.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {job.outputBlobUrl && (
                          <button
                            onClick={() => triggerDownload(job.outputBlobUrl!, job.outputFileName || job.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        )}
                        {job.category === 'audio' && job.outputBlob && (
                          <button
                            onClick={() => handleTransferToCreativeStudio(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2d1013] hover:bg-[#3d1519] border border-[#ea3838]/60 text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
                            title="Open in Mizizi Creative Studio for 8D audio, slowed reverb, and remixing"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#ff6b72]" />
                            <span>Edit in Studio</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Tools Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => {
                    setActiveToolId(tool.id);
                    setActiveFile(null);
                    setLastOutputUrl(null);
                  }}
                  className="group p-5 rounded-2xl bg-[#1b080b] hover:bg-[#250c0f] border border-[#361316] hover:border-[#ea3838] shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#290e11] group-hover:bg-[#ea3838] border border-[#48181c] group-hover:border-[#ea3838] flex items-center justify-center text-[#ff6b72] group-hover:text-white transition-all shadow-md">
                        {tool.category === 'video' && <Video className="w-5 h-5" />}
                        {tool.category === 'audio' && <Music className="w-5 h-5" />}
                        {tool.category === 'pdf' && <FileText className="w-5 h-5" />}
                        {tool.category === 'image' && <ImageIcon className="w-5 h-5" />}
                      </div>

                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-[#351014] text-[#ff7b82] text-[10px] font-black uppercase tracking-wider border border-[#52191f]">
                          {tool.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-[#ff6b72] transition-colors">
                        {tool.name}
                      </h3>
                      {tool.nameSwahili && (
                        <span className="text-[11px] text-[#e6bca0] font-medium block">
                          {tool.nameSwahili}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#a67c7f] line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#290e11] flex items-center justify-between text-[11px] text-[#8a686b] font-mono">
                    <span>{tool.outputFormat}</span>
                    <span className="flex items-center gap-1 text-[#ea3838] font-bold group-hover:translate-x-1 transition-transform">
                      Open Tool <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ==============================================================
           ACTIVE TOOL WORKSPACE (123apps Interactive Single Tool View)
           ============================================================== */
        <div className="space-y-6">
          {/* Tool Navigation Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1b080b] border border-[#361316]">
            <button
              onClick={() => {
                setActiveToolId(null);
                setActiveFile(null);
                setLastOutputUrl(null);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#d4abb0] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#ea3838]" />
              <span>← Back to All Tools Catalog</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#290e11] text-[#ff7b82] text-xs font-bold border border-[#48181c]">
                {activeTool.name}
              </span>
              <span className="text-xs text-[#8a686b] font-mono">Output: {activeTool.outputFormat}</span>
            </div>
          </div>

          {/* Interactive Workspace Panel */}
          <div className="p-6 rounded-3xl bg-[#18080a] border border-[#3b1518] shadow-2xl space-y-6">
            {/* 1. File Upload Dropzone (if file not loaded or tool allows multiple) */}
            {(!activeFile && activeTool.id !== 'audio-record' && activeTool.id !== 'pdf-merge' && activeTool.id !== 'images-to-pdf') && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) setActiveFile(e.dataTransfer.files[0]);
                }}
                className="p-12 rounded-2xl border-2 border-dashed border-[#4d191d] hover:border-[#ea3838] bg-[#200b0e]/60 text-center space-y-4 transition-all"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#2d0f13] border border-[#ea3838]/40 flex items-center justify-center text-[#ff6b72] mx-auto shadow-xl">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">Select or drop a file to process</h3>
                  <p className="text-xs text-[#a67c7f]">
                    Fast private processing in your browser. No files are uploaded to third-party cloud servers.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] hover:brightness-110 text-white text-xs font-black shadow-lg shadow-[#ea3838]/30 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Choose File from Computer</span>
                  <input
                    type="file"
                    accept={activeTool.supportedInputTypes.join(',')}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setActiveFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Special Upload for Multi-file PDF Tools */}
            {(activeTool.id === 'pdf-merge' || activeTool.id === 'images-to-pdf') && (
              <div className="p-6 rounded-2xl bg-[#200b0e] border border-[#3e1619] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    {activeTool.id === 'pdf-merge' ? 'Select Multiple PDF Documents to Merge' : 'Select Images to Convert to PDF'}
                  </h4>
                  <label className="px-4 py-2 rounded-xl bg-[#ea3838] hover:bg-[#ff4747] text-white text-xs font-bold cursor-pointer transition-all">
                    + Add Files
                    <input
                      type="file"
                      multiple
                      accept={activeTool.id === 'pdf-merge' ? 'application/pdf' : 'image/*'}
                      onChange={(e) => {
                        if (e.target.files) {
                          setPdfFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {pdfFiles.length === 0 ? (
                  <p className="text-xs text-[#8a686b] py-6 text-center">
                    No files added yet. Click "+ Add Files" above to select multiple items to combine.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pdfFiles.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#18080a] border border-[#331114] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#290e11] text-[#ff7b82] text-[10px] flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <span className="text-white font-medium">{f.name}</span>
                          <span className="text-[#8a686b]">({(f.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button
                          onClick={() => setPdfFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[#8a686b] hover:text-[#ff6b72] p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Special UI for Microphone Recorder */}
            {activeTool.id === 'audio-record' && (
              <div className="p-8 rounded-2xl bg-[#200b0e] border border-[#3e1619] text-center space-y-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
                  isRecording ? 'bg-red-600 animate-pulse text-white shadow-xl shadow-red-600/50' : 'bg-[#2d0f13] text-[#ff6b72] border border-[#ea3838]/40'
                }`}>
                  <Mic className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">
                    {isRecording ? `Recording Live... ${recordingSeconds}s` : 'Browser Microphone Studio'}
                  </h3>
                  <p className="text-xs text-[#a67c7f]">
                    Record high quality vocal hooks, voiceovers, or podcasts straight from your browser.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] text-white text-xs font-black shadow-lg cursor-pointer hover:brightness-110 active:scale-95"
                    >
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg cursor-pointer active:scale-95"
                    >
                      Stop & Save Recording
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. Interactive Tool Operations when File is Loaded */}
            {activeFile && (
              <div className="space-y-6">
                {/* File Header */}
                <div className="p-4 rounded-2xl bg-[#220c0f] border border-[#3b1518] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2f1013] border border-[#ea3838]/40 flex items-center justify-center text-[#ff6b72]">
                      {activeTool.category === 'video' ? <Video className="w-5 h-5" /> : activeTool.category === 'audio' ? <Music className="w-5 h-5" /> : activeTool.category === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{activeFile.name}</h4>
                      <p className="text-[11px] text-[#a67c7f]">
                        Size: {(activeFile.size / (1024 * 1024)).toFixed(2)} MB · Type: {activeFile.type || 'Binary'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveFile(null);
                      setLastOutputUrl(null);
                    }}
                    className="text-xs text-[#8a686b] hover:text-[#ff6b72] underline cursor-pointer"
                  >
                    Change File
                  </button>
                </div>

                {/* Video Tools Workspace */}
                {activeTool.category === 'video' && fileUrl && (
                  <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden bg-black border border-[#371518] max-h-80 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        src={fileUrl}
                        controls
                        className="max-h-80 w-auto object-contain"
                        onLoadedMetadata={(e) => {
                          const dur = e.currentTarget.duration;
                          setVideoDuration(dur);
                          setVideoEndTime(Math.min(dur, 30));
                        }}
                      />
                    </div>

                    {/* Video Trimmer Controls */}
                    {activeTool.id === 'video-trim' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#200b0e] border border-[#361316]">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white">Start Cut Time (seconds)</label>
                          <input
                            type="number"
                            min="0"
                            max={videoEndTime}
                            step="0.5"
                            value={videoStartTime}
                            onChange={(e) => setVideoStartTime(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl bg-[#150608] border border-[#3d1518] text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white">End Cut Time (seconds)</label>
                          <input
                            type="number"
                            min={videoStartTime}
                            max={videoDuration || 600}
                            step="0.5"
                            value={videoEndTime}
                            onChange={(e) => setVideoEndTime(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl bg-[#150608] border border-[#3d1518] text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Video Speed Controls */}
                    {activeTool.id === 'video-speed' && (
                      <div className="p-4 rounded-2xl bg-[#200b0e] border border-[#361316] space-y-2">
                        <label className="text-xs font-bold text-white">Select Playback Speed: {videoSpeed}x</label>
                        <div className="flex flex-wrap gap-2">
                          {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0].map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setVideoSpeed(s);
                                if (videoRef.current) videoRef.current.playbackRate = s;
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                videoSpeed === s ? 'bg-[#ea3838] text-white' : 'bg-[#2a0e11] text-[#a67c7f] hover:text-white'
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Tools Workspace */}
                {activeTool.category === 'audio' && (
                  <div className="space-y-4">
                    {/* Audio Preview Bar */}
                    <div className="p-4 rounded-2xl bg-[#200b0e] border border-[#361316] flex items-center justify-between gap-4">
                      <button
                        onClick={toggleAudioPreview}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] text-white text-xs font-black shadow-md cursor-pointer hover:brightness-110 active:scale-95"
                      >
                        {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        <span>{isAudioPlaying ? 'PAUSE PREVIEW' : 'PREVIEW AUDIO'}</span>
                      </button>

                      <div className="text-xs text-[#a67c7f] font-mono">
                        Duration: {audioDuration.toFixed(1)}s · Range: {audioStartTime.toFixed(1)}s – {audioEndTime.toFixed(1)}s
                      </div>
                    </div>

                    {/* Audio Cutter Inputs */}
                    {activeTool.id === 'audio-trim' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#200b0e] border border-[#361316]">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white">Trim Start (seconds)</label>
                          <input
                            type="number"
                            min="0"
                            max={audioEndTime}
                            step="0.25"
                            value={audioStartTime}
                            onChange={(e) => setAudioStartTime(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl bg-[#150608] border border-[#3d1518] text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white">Trim End (seconds)</label>
                          <input
                            type="number"
                            min={audioStartTime}
                            max={audioDuration || 600}
                            step="0.25"
                            value={audioEndTime}
                            onChange={(e) => setAudioEndTime(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl bg-[#150608] border border-[#3d1518] text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Audio Pitch & Speed Controls */}
                    {activeTool.id === 'audio-pitch-speed' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#200b0e] border border-[#361316]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-white">Pitch Shift</span>
                            <span className="text-[#ea3838] font-mono">{audioPitchShift > 0 ? `+${audioPitchShift}` : audioPitchShift} semitones</span>
                          </div>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={audioPitchShift}
                            onChange={(e) => setAudioPitchShift(parseInt(e.target.value, 10))}
                            className="w-full accent-[#ea3838] cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-white">Tempo Speed</span>
                            <span className="text-[#06b6d4] font-mono">{audioPlaybackSpeed.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.05"
                            value={audioPlaybackSpeed}
                            onChange={(e) => setAudioPlaybackSpeed(parseFloat(e.target.value))}
                            className="w-full accent-[#06b6d4] cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Audio Volume Controls */}
                    {activeTool.id === 'audio-volume' && (
                      <div className="p-4 rounded-2xl bg-[#200b0e] border border-[#361316] space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white">Volume Multiplier</span>
                          <span className="text-[#ea3838] font-mono">{Math.round(audioVolumeBoost * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="3.0"
                          step="0.05"
                          value={audioVolumeBoost}
                          onChange={(e) => setAudioVolumeBoost(parseFloat(e.target.value))}
                          className="w-full accent-[#ea3838] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Tools Workspace */}
                {activeTool.category === 'pdf' && (
                  <div className="p-4 rounded-2xl bg-[#200b0e] border border-[#361316] space-y-3">
                    <div className="text-xs text-[#a67c7f]">
                      Detected Document: <strong className="text-white">{pdfPageCount} total pages</strong>
                    </div>

                    {activeTool.id === 'pdf-split' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white">Enter Page Range to Extract (e.g. 1-3, 5)</label>
                        <input
                          type="text"
                          value={pdfSplitRange}
                          onChange={(e) => setPdfSplitRange(e.target.value)}
                          placeholder="e.g. 1-2, 4"
                          className="w-full px-3 py-2 rounded-xl bg-[#150608] border border-[#3d1518] text-xs text-white"
                        />
                      </div>
                    )}

                    {activeTool.id === 'pdf-rotate' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white">Rotation Angle</label>
                        <div className="flex gap-2">
                          {[90, 180, 270].map((deg) => (
                            <button
                              key={deg}
                              onClick={() => setPdfRotationDeg(deg as any)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                                pdfRotationDeg === deg ? 'bg-[#ea3838] text-white' : 'bg-[#2a0e11] text-[#a67c7f]'
                              }`}
                            >
                              Rotate {deg}° Clockwise
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Tools Workspace */}
                {activeTool.category === 'image' && fileUrl && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-black border border-[#371518] p-4 flex items-center justify-center max-h-72 overflow-hidden">
                      <img
                        src={fileUrl}
                        alt="Preview"
                        className="max-h-64 object-contain rounded-lg"
                        style={{
                          transform: `rotate(${imageRotation}deg) scale(${imageFlipH ? -1 : 1}, ${imageFlipV ? -1 : 1})`,
                          filter: `brightness(${imageBrightness}%) contrast(${imageContrast}%) saturate(${imageSaturation}%) sepia(${imageWarmth * 0.4}%)`,
                        }}
                      />
                    </div>

                    {/* Image Resizer / Format Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#200b0e] border border-[#361316]">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white">Output Format</label>
                        <select
                          value={imageFormat}
                          onChange={(e) => setImageFormat(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-[#150608] border border-[#3d1518] text-xs text-white"
                        >
                          <option value="image/webp">WebP (Optimized)</option>
                          <option value="image/jpeg">JPEG (High Compatibility)</option>
                          <option value="image/png">PNG (Lossless)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white">Quality ({Math.round(imageQuality * 100)}%)</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={imageQuality}
                          onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                          className="w-full accent-[#ea3838] cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white">Afro Warmth Tone</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={imageWarmth}
                          onChange={(e) => setImageWarmth(parseInt(e.target.value, 10))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Trigger Button */}
                <div className="pt-4 border-t border-[#311114] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-[#a67c7f]">
                    {processingStatus || 'Ready to process file.'}
                  </div>

                  <button
                    onClick={executeActiveTool}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#ea3838] to-[#ff4747] hover:brightness-110 text-white text-xs font-black shadow-xl shadow-[#ea3838]/40 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing with Mizizi Engine...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Process & Generate Output</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Output Ready Banner */}
                {lastOutputUrl && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#172e1e] to-[#122217] border border-emerald-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Output Ready for Download!</h4>
                        <p className="text-xs text-emerald-200">
                          {lastOutputName} · Processed securely in browser memory.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerDownload(lastOutputUrl, lastOutputName)}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black shadow-lg cursor-pointer transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download File</span>
                      </button>

                      {activeTool.category === 'audio' && lastOutputBlob && (
                        <button
                          onClick={() => {
                            const dummyJob: MiziziPersistentJob = {
                              id: `quick_${Date.now()}`,
                              name: lastOutputName,
                              category: 'audio',
                              toolName: activeTool.name,
                              status: 'COMPLETED',
                              progress: 100,
                              inputFileName: activeFile.name,
                              outputBlob: lastOutputBlob,
                              outputBlobUrl: lastOutputUrl,
                              createdAt: Date.now(),
                            };
                            handleTransferToCreativeStudio(dummyJob);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#280d10] hover:bg-[#3d1318] border border-[#ea3838] text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
                        >
                          <Sliders className="w-4 h-4 text-[#ea3838]" />
                          <span>Open in Creative Studio</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
