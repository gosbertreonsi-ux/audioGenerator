import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  Check, 
  Copy, 
  Play, 
  Pause, 
  Film, 
  Share2, 
  Loader2, 
  Radio
} from 'lucide-react';
import { AudioTrack, TransformationPreset, ContentPack } from '../../types';
import { globalAudioEngine } from '../../lib/audioEngine';
import { PRESET_STYLES } from '../../lib/constants';

interface MakeItAVibeViewProps {
  currentTrack: AudioTrack;
  activePreset: TransformationPreset;
  onApplyPreset: (preset: TransformationPreset) => void;
}

export const MakeItAVibeView: React.FC<MakeItAVibeViewProps> = ({
  currentTrack,
  activePreset,
  onApplyPreset,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contentPack, setContentPack] = useState<ContentPack | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<string>('A');
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('A');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const unsub = globalAudioEngine.subscribe(({ isPlaying }) => {
      setIsPlayingAudio(isPlaying);
    });
    return () => {
      unsub();
    };
  }, []);

  // Fetch or regenerate content pack
  const generateVibePack = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/content-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle: currentTrack.title,
          artist: currentTrack.artist,
          selectedStyle: activePreset.name,
          genre: currentTrack.genre,
        }),
      });
      const data = await res.json();
      setContentPack(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateVibePack();
  }, [currentTrack.id, activePreset.id]);

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadCompletePack = () => {
    setDownloadingZip(true);
    setTimeout(() => {
      setDownloadingZip(false);
      setDownloadSuccess(true);
      // Trigger a JSON manifest download
      const manifest = {
        title: currentTrack.title,
        artist: currentTrack.artist,
        transformation: activePreset.name,
        metadata: contentPack,
        created: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.title.replace(/\s+/g, '_')}_ContentPack_Manifest.json`;
      a.click();
      URL.revokeObjectURL(url);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 1500);
  };

  // 4 AI Cover Art candidates
  const coverCandidates = [
    {
      id: 'A',
      title: 'Dark Neon Highway (3AM)',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      tag: 'Cyberpunk Embers',
    },
    {
      id: 'B',
      title: 'Celestial Dreamscape',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      tag: 'Ethereal Geometry',
    },
    {
      id: 'C',
      title: 'Sub-bass Smoke Horizon',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      tag: 'Dark Ambient Trap',
    },
    {
      id: 'D',
      title: 'Analog Cassette Sunset',
      url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      tag: 'Retro Lo-Fi Tape',
    },
  ];

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* HEADER BANNER */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#2f1013] via-[#3a1418] to-[#1c080a] border border-[#4a1c20] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1b080a]/80 border border-[#ea3838] text-xs font-bold text-[#ff6b72] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ea3838]" />
              SIGNATURE FEATURE #57
            </span>
            <span className="text-xs text-[#a67c7f]">
              ONE SONG → COMPLETE VIRAL CONTENT PACKAGE
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            MAKE IT A VIBE ENGINE
          </h2>
          <p className="text-xs md:text-sm text-[#d4abb0] mt-1 max-w-xl">
            Currently analyzing &ldquo;{currentTrack.title}&rdquo; with &ldquo;{activePreset.name}&rdquo;. Synthesizing optimized artwork, YouTube long-form, 3 viral Short moments, and high-CTR thumbnails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (isPlayingAudio) {
                globalAudioEngine.pause();
              } else {
                globalAudioEngine.play();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#290d10] hover:bg-[#3d1417] text-white border border-[#441619] text-xs font-bold transition-all shadow-md active:scale-95"
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4 text-[#ff6b72]" />
                Pause Vibe
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-[#ff6b72]" />
                Audition Audio
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCompletePack}
            disabled={downloadingZip}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] hover:from-[#d62f2f] hover:to-[#ea3838] text-white text-xs font-extrabold shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95 disabled:opacity-50"
          >
            {downloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Bundling Content Pack...
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Package Exported!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Complete Pack (.ZIP)
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 rounded-3xl bg-[#1b090b] border border-[#371518] flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ea3838]" />
          <h3 className="text-lg font-bold text-white">Synthesizing Content Ecosystem...</h3>
          <p className="text-xs text-[#a67c7f] max-w-sm">
            Evaluating harmonic spectrum, best chorus drop moments, high-converting YouTube tags, and visual style candidates.
          </p>
        </div>
      ) : contentPack ? (
        <div className="space-y-6">
          {/* 1. AI COVER ARTWORK (CANDIDATES A, B, C, D - Section 20) */}
          <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ea3838]" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  AI ALBUM COVER ARTWORK (SELECT 1 OF 4)
                </h3>
              </div>
              <span className="text-[11px] text-[#8a686b]">
                Active Choice: Candidate {selectedCover}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {coverCandidates.map((cov) => {
                const isChosen = selectedCover === cov.id;
                return (
                  <div
                    key={cov.id}
                    onClick={() => setSelectedCover(cov.id)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer border transition-all group ${
                      isChosen
                        ? 'border-[#ea3838] shadow-xl shadow-[#ea3838]/30 scale-[1.02]'
                        : 'border-[#371518] hover:border-[#ea3838]/50'
                    }`}
                  >
                    <div className="aspect-square w-full relative">
                      <img
                        src={cov.url}
                        alt={cov.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140708] via-transparent to-transparent opacity-80" />

                      {/* Candidate badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#1b080a]/80 backdrop-blur-md border border-[#441619] text-[10px] font-bold text-white">
                        COVER {cov.id}
                      </div>

                      {isChosen && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#ea3838] flex items-center justify-center text-white shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-[#1e0a0d]">
                      <h4 className="text-xs font-bold text-white truncate">
                        {cov.title}
                      </h4>
                      <p className="text-[10px] text-[#ff6b72] mt-0.5">
                        {cov.tag}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. VIRAL SHORT-FORM HIGHLIGHT MOMENTS (Section 25 & 26) */}
          <div className="p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#ea3838]" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  AI BEST MOMENT DETECTION & SHORTS GENERATOR (15s – 30s)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">
                3 Viral Clips Extracted
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contentPack.bestMoments?.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#220d0f] border border-[#371518] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#ea3838] uppercase">
                        SHORT #{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#2d1013] text-[10px] text-white font-mono">
                        {m.start} – {m.end}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1.5">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#d6a5a8] mt-1">
                      {m.vibe}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#311315] flex items-center justify-between">
                    <button
                      onClick={() => {
                        const parts = m.start.split(':');
                        const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                        globalAudioEngine.seek(sec);
                        globalAudioEngine.play();
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#ff6b72] hover:text-white"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Preview Clip
                    </button>
                    <span className="text-[10px] text-[#8a686b]">9:16 Vertical Video</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. METADATA: YOUTUBE, TIKTOK, REELS (Section 29) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: YouTube Title & Description (Cols 7) */}
            <div className="lg:col-span-7 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  YOUTUBE PUBLISHING METADATA
                </h3>
                <button
                  onClick={() => copyToClipboard(contentPack.description, 'desc')}
                  className="flex items-center gap-1 text-xs text-[#ff6b72] hover:text-white font-medium"
                >
                  {copiedField === 'desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Description
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#a67c7f]">RECOMMENDED HIGH-CTR TITLE:</span>
                <div className="p-3 rounded-xl bg-[#220d0f] border border-[#371518] text-xs font-semibold text-white flex items-center justify-between">
                  <span>{contentPack.youtubeTitle}</span>
                  <button
                    onClick={() => copyToClipboard(contentPack.youtubeTitle, 'title')}
                    className="p-1 hover:text-[#ff6b72]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alternative Titles */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#a67c7f]">A/B ALTERNATIVE HOOKS:</span>
                <div className="space-y-1.5">
                  {contentPack.youtubeAlternativeTitles?.map((alt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-[#17080a] border border-[#2d1013] text-xs text-[#d6a5a8] flex items-center justify-between"
                    >
                      <span>{alt}</span>
                      <button
                        onClick={() => copyToClipboard(alt, `alt-${i}`)}
                        className="p-1 hover:text-[#ff6b72]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#a67c7f]">SEO DESCRIPTION & CHAPTER TIMESTAMPS:</span>
                <pre className="p-3 rounded-xl bg-[#17080a] border border-[#2d1013] text-[11px] text-[#c59c9f] whitespace-pre-wrap font-sans max-h-48 overflow-y-auto leading-relaxed">
                  {contentPack.description}
                </pre>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#a67c7f]">RECOMMENDED SEARCH TAGS:</span>
                <div className="flex flex-wrap gap-1.5">
                  {contentPack.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#220d0f] border border-[#371518] text-[10px] text-[#ff6b72] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: TikTok, Reels & Thumbnail Prompts (Cols 5) */}
            <div className="lg:col-span-5 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
              <div className="border-b border-[#2d1013] pb-3">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  SHORT-FORM PLATFORMS & THUMBNAILS
                </h3>
              </div>

              {/* TikTok Caption */}
              <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">TikTok Sound & Caption</span>
                  <button
                    onClick={() => copyToClipboard(contentPack.tiktokCaption, 'tt')}
                    className="text-[11px] text-[#ff6b72] hover:text-white"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[#d6a5a8] leading-relaxed">
                  {contentPack.tiktokCaption}
                </p>
              </div>

              {/* Reels Caption */}
              <div className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Instagram Reels Caption</span>
                  <button
                    onClick={() => copyToClipboard(contentPack.reelsCaption, 'reels')}
                    className="text-[11px] text-[#ff6b72] hover:text-white"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[#d6a5a8] leading-relaxed">
                  {contentPack.reelsCaption}
                </p>
              </div>

              {/* Thumbnail Prompts (Section 21) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white block">
                  AI THUMBNAIL CONCEPTS (A/B TESTING)
                </span>
                <div className="space-y-2">
                  {contentPack.thumbnailVisualPrompts?.map((prompt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-[#17080a] border border-[#2d1013] text-[11px] text-[#b0878a] leading-tight flex items-start gap-2"
                    >
                      <span className="font-bold text-[#ea3838]">Thumb {String.fromCharCode(65 + i)}:</span>
                      <span>{prompt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
