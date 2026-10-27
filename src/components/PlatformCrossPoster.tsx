import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, Hash, MessageSquare, AlertCircle, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SocialPostItem, SocialPlatform } from '../types/social';
import { PLATFORMS_INFO } from '../utils/excelParser';
import { executeSimulatedPublish } from '../utils/schedulerEngine';

interface PlatformCrossPosterProps {
  post: SocialPostItem;
  onUpdatePost: (updated: SocialPostItem) => void;
}

export const PlatformCrossPoster: React.FC<PlatformCrossPosterProps> = ({
  post,
  onUpdatePost,
}) => {
  const [activeTab, setActiveTab] = useState<SocialPlatform>('instagram');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [justPublished, setJustPublished] = useState<boolean>(false);

  const currentPlatformContent = post.platformContents[activeTab];
  const platformMeta = PLATFORMS_INFO[activeTab];

  // Caption character tracking
  const textLength = (currentPlatformContent.caption || '').length;
  const isOverLimit = textLength > currentPlatformContent.characterLimit;

  // Toggle platform enabled/disabled
  const handleTogglePlatform = (platform: SocialPlatform) => {
    onUpdatePost({
      ...post,
      platformContents: {
        ...post.platformContents,
        [platform]: {
          ...post.platformContents[platform],
          enabled: !post.platformContents[platform].enabled,
        },
      },
    });
  };

  // Update caption
  const handleCaptionChange = (val: string) => {
    onUpdatePost({
      ...post,
      platformContents: {
        ...post.platformContents,
        [activeTab]: {
          ...post.platformContents[activeTab],
          caption: val,
        },
      },
    });
  };

  // Update title for platforms like YouTube
  const handleTitleChange = (val: string) => {
    onUpdatePost({
      ...post,
      platformContents: {
        ...post.platformContents,
        [activeTab]: {
          ...post.platformContents[activeTab],
          title: val,
        },
      },
    });
  };

  // Add or remove hashtag
  const handleRemoveHashtag = (tag: string) => {
    const updated = currentPlatformContent.hashtags.filter(t => t !== tag);
    onUpdatePost({
      ...post,
      platformContents: {
        ...post.platformContents,
        [activeTab]: {
          ...post.platformContents[activeTab],
          hashtags: updated,
        },
      },
    });
  };

  // Immediate Cross-Posting Execution
  const handlePublishAll = async () => {
    setIsPublishing(true);
    await new Promise(r => setTimeout(r, 700));

    const updated = executeSimulatedPublish(post);
    onUpdatePost(updated);
    setIsPublishing(false);
    setJustPublished(true);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => setJustPublished(false), 3000);
  };

  // Switch status to scheduled
  const handleMarkScheduled = () => {
    onUpdatePost({
      ...post,
      status: 'scheduled',
      publishLogs: [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          platform: activeTab,
          status: 'queued',
          message: `Auto-dispatch locked for ${post.date} at ${post.time}`,
        },
        ...post.publishLogs,
      ],
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Platform Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Multi-Platform Content Details
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
              From Excel Sheet
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tailored text, hashtags, and format constraints for each destination
          </p>
        </div>

        {/* Global Post Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkScheduled}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Schedule ({post.date} {post.time})
          </button>

          <button
            type="button"
            onClick={handlePublishAll}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isPublishing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : justPublished ? (
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            ) : (
              <Send className="w-4 h-4 text-slate-950" />
            )}
            {isPublishing ? 'Publishing All...' : justPublished ? 'Posted!' : 'Publish to All Platforms Now'}
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(PLATFORMS_INFO) as SocialPlatform[]).map(platform => {
          const info = PLATFORMS_INFO[platform];
          const isSelected = activeTab === platform;
          const isEnabled = post.platformContents[platform].enabled;

          return (
            <button
              key={platform}
              type="button"
              onClick={() => setActiveTab(platform)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isEnabled ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
              <span>{info.name}</span>
            </button>
          );
        })}
      </div>

      {/* Editor & Preview Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Content Editor */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${platformMeta.badgeColor}`}
              >
                {platformMeta.name}
              </span>
              <span className="text-xs text-slate-400">{platformMeta.description}</span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={currentPlatformContent.enabled}
                onChange={() => handleTogglePlatform(activeTab)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Enabled</span>
            </label>
          </div>

          {/* YouTube Video Title Field */}
          {activeTab === 'youtube' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                YouTube Shorts Title (High CTR & SEO)
              </label>
              <input
                type="text"
                value={currentPlatformContent.title || ''}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Day 1: Title Hook for YouTube Shorts"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Platform Caption / Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Platform Caption & Script Copy
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {textLength} / {currentPlatformContent.characterLimit} chars
              </span>
            </div>
            <textarea
              rows={6}
              value={currentPlatformContent.caption}
              onChange={e => handleCaptionChange(e.target.value)}
              className={`w-full bg-slate-950 border rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none ${
                isOverLimit
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-cyan-500'
              }`}
              placeholder="Enter platform specific caption..."
            />
          </div>

          {/* Hashtags list */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Target Hashtags & Keywords
              </label>
              <span className="text-[11px] text-slate-500">Click to remove</span>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
              {currentPlatformContent.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  onClick={() => handleRemoveHashtag(tag)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-cyan-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  {tag}
                  <span className="text-[10px] text-slate-500">×</span>
                </span>
              ))}
            </div>
          </div>

          {/* Platform Specific Extra Details */}
          {activeTab === 'instagram' && currentPlatformContent.firstComment && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-pink-400" /> First Comment Trigger (Pinned)
              </span>
              <p className="text-xs text-slate-300 italic">{currentPlatformContent.firstComment}</p>
            </div>
          )}

          {activeTab === 'tiktok' && currentPlatformContent.soundName && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Sound Track Attribution
              </span>
              <p className="text-xs text-slate-300">{currentPlatformContent.soundName}</p>
            </div>
          )}
        </div>

        {/* Right: Authentic Platform Live Mockup */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Mockup ({platformMeta.name})
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-Synced
            </span>
          </div>

          {/* Mockup Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[360px]">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-xs">
                  OP
                </div>
                <div>
                  <div className="text-xs font-bold text-white">OmniPost Official</div>
                  <div className="text-[10px] text-slate-400">@omnipost_studio • Nov {post.dayIndex}</div>
                </div>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                {post.time}
              </span>
            </div>

            {/* Video preview mini card */}
            <div className="my-3 rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center gap-3 relative overflow-hidden">
              <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-indigo-900 to-slate-950 flex flex-col items-center justify-center text-center p-1 border border-cyan-500/30 shrink-0">
                <span className="text-[9px] font-bold text-cyan-400 uppercase">NOV {post.dayIndex}</span>
                <span className="text-[8px] text-slate-300 mt-1 line-clamp-2">{post.topic}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {activeTab === 'youtube' ? currentPlatformContent.title : post.topic}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {post.coreHook}
                </div>
                <div className="text-[10px] text-cyan-400 mt-1 font-mono">
                  {post.videoConfig.aspectRatio} • {post.videoConfig.totalDuration}s • 4K HD
                </div>
              </div>
            </div>

            {/* Caption in mockup */}
            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto pr-1">
              {currentPlatformContent.caption}
            </div>

            {/* Hashtag tags in mockup */}
            <div className="flex flex-wrap gap-1 mt-2">
              {currentPlatformContent.hashtags.map((tag, i) => (
                <span key={i} className="text-[11px] text-cyan-400 font-medium">
                  {tag}
                </span>
              ))}
            </div>

            {/* Platform Mockup Footer */}
            <div className="border-t border-slate-800/80 pt-2.5 mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>❤️ 2.4k likes</span>
              <span>💬 142 comments</span>
              <span>↗️ 88 shares</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
