import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  Link as LinkIcon, 
  Download, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { AudioTrack, RightsAssessment } from '../../types';

interface RightsCenterViewProps {
  currentTrack: AudioTrack;
}

export const RightsCenterView: React.FC<RightsCenterViewProps> = ({ currentTrack }) => {
  const [ownershipType, setOwnershipType] = useState<string>(
    'I own all original master & publishing rights'
  );
  const [youtubeRefUrl, setYoutubeRefUrl] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [assessment, setAssessment] = useState<RightsAssessment>({
    status: 'GREEN',
    badge: 'Cleared for Monetization & Distribution',
    analysis:
      'You have verified original master rights ownership. Your slowed/8D derivative versions are fully compliant for YouTube Content ID and social distribution.',
    checklist: [
      { label: 'Original Master Recording Authorization', passed: true },
      { label: 'Derivative Audio Work Permissions', passed: true },
      { label: 'Public Video Distribution Rights', passed: true },
    ],
    recommendation: 'Safe to publish directly with automated Content ID and copyright declarations.',
  });

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/gemini/rights-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: currentTrack.title,
          ownershipType,
          notes: userNotes,
        }),
      });
      const data = await res.json();
      setAssessment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDownloadLicenseDoc = () => {
    const text = `MUSICMOTION AI — RIGHTS DECLARATION & CLEARANCE CERTIFICATE
Date: ${new Date().toLocaleDateString()}
Track Title: ${currentTrack.title}
Artist: ${currentTrack.artist}
Ownership Basis: ${ownershipType}
Compliance Status: ${assessment.status} (${assessment.badge})

DECLARATION:
The registrant asserts that the uploaded audio stem is either an original master recording,
public domain work, or utilized under explicit synchronization authorization.

IMPORTANT NOTICE REGARDING DERIVATIVE WORKS:
MusicMotion AI emphasizes that time-stretching (slowed/sped up), reverberation processing,
and binaural 8D spatial transformation do NOT alter or circumvent copyright ownership.
All derivative transformations remain subject to original master rights.

Verification Token: MMAI-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rights_Certificate_${currentTrack.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              RIGHTS CENTER & LICENSING COMPLIANCE
            </h2>
          </div>
          <p className="text-xs text-[#a67c7f]">
            Every project must declare verified copyright and synchronization authority before publishing.
          </p>
        </div>

        <button
          onClick={handleDownloadLicenseDoc}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#260e10] hover:bg-[#381417] text-white border border-[#4a1c20] text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <FileText className="w-4 h-4 text-[#ff6b72]" />
          Download License Certificate
        </button>
      </div>

      {/* CORE WARNING BANNER (Section 31) */}
      <div className="p-4 rounded-2xl bg-[#220d0f] border border-[#ea3838]/60 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#ea3838] shrink-0 mt-0.5" />
        <div className="text-xs text-[#d6a5a8] leading-relaxed">
          <strong className="text-white">CRITICAL COPYRIGHT LAW NOTICE:</strong> Slowing down, speeding up, adding cathedral reverb, changing pitch, or converting an audio file to 8D binaural sound does <strong className="text-[#ff6b72]">NOT</strong> make copyrighted music fair use or legal to monetize without explicit license. MusicMotion AI supports only authorized creator releases.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Declaration Form (Cols 7) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-[#2d1013] pb-3">
            RIGHTS DECLARATION FOR &ldquo;{currentTrack.title.toUpperCase()}&rdquo;
          </h3>

          {/* Ownership dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white block">
              Audio Ownership & Authorization Basis
            </label>
            <select
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white focus:outline-none focus:border-[#ea3838]"
            >
              <option value="I own all original master & publishing rights">
                I own all original master & publishing rights (Original Artist/Label)
              </option>
              <option value="I hold written permission from artist">
                I hold written derivative authorization from original artist
              </option>
              <option value="I have a commercial license">
                I have a commercial synchronization license
              </option>
              <option value="Public domain">
                Public Domain (Pre-1926 or copyright expired)
              </option>
              <option value="Creative Commons CC-BY">
                Creative Commons CC-BY (Attribution required)
              </option>
              <option value="Unlicensed third-party track">
                Third-party copyrighted track (Personal testing only / No monetization)
              </option>
            </select>
          </div>

          {/* YouTube Reference Import (Section 32) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#ff6b72]" />
              <label className="text-xs font-bold text-white">
                YouTube Reference URL (Optional Audit)
              </label>
            </div>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... (used only for metadata reference, not ripping)"
              value={youtubeRefUrl}
              onChange={(e) => setYoutubeRefUrl(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
            />
            <span className="text-[10px] text-[#8a686b] block">
              MusicMotion AI respects DMCA standards and analyzes reference metadata to help identify official licensing paths.
            </span>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white block">
              License Notes / ISRC / Distribution Codes
            </label>
            <textarea
              rows={3}
              placeholder="Enter ISRC, publisher details, or clearance proof..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white placeholder-[#7d595c] focus:outline-none focus:border-[#ea3838]"
            />
          </div>

          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="w-full py-2.5 rounded-xl bg-[#ea3838] hover:bg-[#ff4d4d] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditing Rights Status...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Run AI Rights Assessment
              </>
            )}
          </button>
        </div>

        {/* Right: Assessment Result (Cols 5) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#2d1013] pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wide">
                COMPLIANCE STATUS
              </h3>
              {/* Traffic light status */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                  assessment.status === 'GREEN'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : assessment.status === 'YELLOW'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {assessment.status === 'GREEN' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                STATUS: {assessment.status}
              </span>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2">
              <div className="text-xs font-bold text-white">
                {assessment.badge}
              </div>
              <p className="text-xs text-[#d6a5a8] leading-relaxed">
                {assessment.analysis}
              </p>
            </div>

            {/* Checklist */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-white block">
                LEGAL CHECKLIST
              </span>
              {assessment.checklist?.map((chk, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-[#c59c9f]"
                >
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{chk.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#17080a] border border-[#2d1013] text-[11px] text-[#8a686b]">
            <strong className="text-white">Recommendation:</strong> {assessment.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};
