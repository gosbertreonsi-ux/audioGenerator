import React, { useState } from 'react';
import { 
  Send, 
  Youtube, 
  Video, 
  Instagram, 
  Calendar, 
  Check, 
  Clock, 
  Layers, 
  Trash2, 
  Pause, 
  Play,
  Share2
} from 'lucide-react';
import { AudioTrack, TransformationPreset, JobItem } from '../../types';
import { INITIAL_JOBS } from '../../lib/constants';

interface PublishingViewProps {
  currentTrack: AudioTrack;
  activePreset: TransformationPreset;
}

export const PublishingView: React.FC<PublishingViewProps> = ({
  currentTrack,
  activePreset,
}) => {
  const [platform, setPlatform] = useState<'youtube' | 'tiktok' | 'instagram'>('youtube');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'scheduled'>('public');
  const [publishTitle, setPublishTitle] = useState(
    `${currentTrack.title} — ${activePreset.name} (Official Audio Experience)`
  );
  const [publishScheduleDate, setPublishScheduleDate] = useState('2026-10-08T18:00');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Job queue state
  const [jobs, setJobs] = useState<JobItem[]>(
    INITIAL_JOBS.map((j) => ({
      ...j,
      type: j.type as JobItem['type'],
      status: j.status as JobItem['status'],
    }))
  );

  const handlePublishNow = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishedSuccess(true);
      // Add new job to queue
      const newJob: JobItem = {
        id: `job-${Date.now()}`,
        title: `${currentTrack.title} (${platform.toUpperCase()})`,
        type: 'Content Pack',
        status: 'PROCESSING',
        progress: 10,
        size: '108 MB',
        eta: '2 min left',
        timestamp: 'Just now',
      };
      setJobs([newJob, ...jobs]);
      setTimeout(() => setPublishedSuccess(false), 4000);
    }, 1200);
  };

  const handleRemoveJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
  };

  const handleToggleJob = (id: string) => {
    setJobs(
      jobs.map((j) => {
        if (j.id === id) {
          return {
            ...j,
            status: j.status === 'PROCESSING' ? 'PAUSED' : 'PROCESSING',
          };
        }
        return j;
      })
    );
  };

  return (
    <div className="flex-1 p-5 md:p-7 overflow-y-auto space-y-6 select-none bg-[#140708] text-[#f4e8e8]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-5 h-5 text-[#ea3838]" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              MULTI-PLATFORM PUBLISHER & JOB QUEUE
            </h2>
          </div>
          <p className="text-xs text-[#a67c7f]">
            Direct publishing to YouTube, TikTok, and Instagram Reels with synchronized metadata.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Publisher Composer (Cols 7) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide border-b border-[#2d1013] pb-3">
            PUBLISHING COMPOSER
          </h3>

          {/* Platform selection pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
              { id: 'tiktok', label: 'TikTok', icon: Video, color: 'text-cyan-400' },
              { id: 'instagram', label: 'Instagram Reels', icon: Instagram, color: 'text-pink-500' },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id as 'youtube' | 'tiktok' | 'instagram')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    platform === p.id
                      ? 'bg-[#2e1013] border-[#ea3838] text-white shadow-md shadow-[#ea3838]/20'
                      : 'bg-[#220d0f] border-[#371518] text-[#a67c7f] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${p.color}`} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white block">Release Title</label>
            <input
              type="text"
              value={publishTitle}
              onChange={(e) => setPublishTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white focus:outline-none focus:border-[#ea3838]"
            />
          </div>

          {/* Visibility & Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white block">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'unlisted' | 'scheduled')}
                className="w-full px-3 py-2.5 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white focus:outline-none focus:border-[#ea3838]"
              >
                <option value="public">Public (Immediate Distribution)</option>
                <option value="unlisted">Unlisted (Private Review Link)</option>
                <option value="scheduled">Schedule for Optimal Engagement</option>
              </select>
            </div>

            {visibility === 'scheduled' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">Schedule Time</label>
                <input
                  type="datetime-local"
                  value={publishScheduleDate}
                  onChange={(e) => setPublishScheduleDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#220d0f] border border-[#3e1618] text-xs text-white focus:outline-none focus:border-[#ea3838]"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handlePublishNow}
              disabled={isPublishing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ea3838] to-[#ff5252] hover:from-[#d62f2f] hover:to-[#ea3838] text-white text-xs font-black shadow-lg shadow-[#ea3838]/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Publishing Stream...
                </>
              ) : publishedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Broadcast Initiated!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {visibility === 'scheduled' ? 'Schedule Release' : 'Publish Video Now'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Background Job Queue (Cols 5) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#1b090b] border border-[#371518] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d1013] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ea3838]" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                ACTIVE JOB QUEUE & WORKERS
              </h3>
            </div>
            <span className="text-[11px] text-[#ff6b72] font-semibold">
              {jobs.filter((j) => j.status === 'PROCESSING').length} Processing
            </span>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-2xl bg-[#220d0f] border border-[#371518] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {job.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : job.status === 'PROCESSING'
                        ? 'bg-[#ea3838]/20 text-[#ff6b72] animate-pulse'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8a686b]">
                  <span>{job.size}</span>
                  <span>{job.eta}</span>
                </div>

                {job.status === 'PROCESSING' && (
                  <div className="w-full h-1.5 rounded-full bg-[#140708] overflow-hidden">
                    <div
                      className="h-full bg-[#ea3838] transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#311315]">
                  {job.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleToggleJob(job.id)}
                      className="p-1 text-[#a67c7f] hover:text-white"
                      title="Pause / Resume"
                    >
                      {job.status === 'PAUSED' ? (
                        <Play className="w-3.5 h-3.5" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveJob(job.id)}
                    className="p-1 text-[#a67c7f] hover:text-rose-400"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
