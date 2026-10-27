import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Play, 
  Send, 
  XCircle, 
  Eye, 
  Film, 
  Share2, 
  Filter, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SocialPostItem, SocialPlatform } from '../types/social';
import { approvePost, rejectPost, batchApprovePosts, executeSimulatedPublish } from '../utils/schedulerEngine';
import confetti from 'canvas-confetti';

interface ApprovalQueueProps {
  posts: SocialPostItem[];
  onUpdatePost: (updatedPost: SocialPostItem) => void;
  onUpdateAllPosts: (updatedPosts: SocialPostItem[]) => void;
  onSelectPostForStudio?: (post: SocialPostItem) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  posts,
  onUpdatePost,
  onUpdateAllPosts,
  onSelectPostForStudio,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'published'>('pending');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPosts = posts.filter(post => {
    // Filter by tab
    if (filter === 'pending') {
      const isPending = post.status === 'pending_review' || post.reviewStatus === 'pending';
      if (!isPending) return false;
    } else if (filter === 'approved') {
      const isApproved = (post.status === 'approved' || post.reviewStatus === 'approved') && post.status !== 'published';
      if (!isApproved) return false;
    } else if (filter === 'published') {
      if (post.status !== 'published') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTopic = post.topic.toLowerCase().includes(q);
      const matchHook = post.coreHook.toLowerCase().includes(q);
      const matchDate = post.date.includes(q);
      if (!matchTopic && !matchHook && !matchDate) return false;
    }

    return true;
  });

  const pendingCount = posts.filter(
    p => p.status === 'pending_review' || p.reviewStatus === 'pending'
  ).length;

  const approvedCount = posts.filter(
    p => (p.status === 'approved' || p.reviewStatus === 'approved') && p.status !== 'published'
  ).length;

  const handleApprove = (post: SocialPostItem) => {
    const approved = approvePost(post, 'Administrator (2FA Verified)');
    onUpdatePost(approved);
    try {
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
  };

  const handleApproveAndPublishNow = (post: SocialPostItem) => {
    const approved = approvePost(post, 'Administrator (2FA Verified)');
    const published = executeSimulatedPublish(approved);
    onUpdatePost(published);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  const handleRejectSubmit = (post: SocialPostItem) => {
    if (!rejectReason.trim()) return;
    const rejected = rejectPost(post, rejectReason.trim());
    onUpdatePost(rejected);
    setRejectingPostId(null);
    setRejectReason('');
  };

  const handleBatchApproveAllPending = () => {
    const pendingIds = posts
      .filter(p => p.status === 'pending_review' || p.reviewStatus === 'pending')
      .map(p => p.id);
    
    if (pendingIds.length === 0) return;

    const updated = batchApprovePosts(posts, pendingIds, 'Administrator (2FA Verified)');
    onUpdateAllPosts(updated);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Admin Video Approval Queue</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  {pendingCount} AWAITING APPROVAL
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Mandatory publishing gatekeeper. Review and approve generated videos before social syndication.
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={handleBatchApproveAllPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Batch Approve All ({pendingCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Ready ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('published')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'published'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Live Published</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Videos ({posts.length})</span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topic, hook, date..."
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* List of Posts in Queue */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-900/30">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No videos matching this filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'pending'
              ? 'Great work! All scheduled videos have been reviewed and approved by the admin team.'
              : 'Try selecting a different filter or search term above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map(post => {
            const isPending = post.status === 'pending_review' || post.reviewStatus === 'pending';
            const isApproved = post.status === 'approved' || post.reviewStatus === 'approved';
            const isPublished = post.status === 'published';

            return (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-4 shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-mono font-bold text-cyan-400 border border-slate-700">
                      Day {post.dayIndex} • {post.date}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {post.time}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {post.category}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>AWAITING APPROVAL</span>
                      </span>
                    )}

                    {isApproved && !isPublished && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>APPROVED BY ADMIN</span>
                      </span>
                    )}

                    {isPublished && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                        <Send className="w-3 h-3 text-cyan-400" />
                        <span>LIVE ON 4 PLATFORMS</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left: Topic & Hook */}
                  <div className="lg:col-span-2 space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{post.topic}</h4>
                      <p className="text-xs text-cyan-400/90 font-medium mt-0.5">
                        "{post.coreHook}"
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                      {post.fullScript}
                    </p>

                    {/* Target Platforms */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Platforms:</span>
                      <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30">Facebook</span>
                      <span className="px-2 py-0.5 rounded bg-pink-600/20 text-pink-300 border border-pink-500/30">Instagram</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">TikTok</span>
                      <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-300 border border-red-500/30">YouTube</span>
                    </div>

                    {/* Admin stamp info */}
                    {post.approvedBy && (
                      <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved by {post.approvedBy} on {new Date(post.approvedAt || '').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    )}

                    {post.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        <span className="font-bold">Revision Requested:</span> {post.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Right: Video Specs & Fast Play */}
                  <div className="flex flex-col justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Video Duration:</span>
                        <span className="font-mono font-bold text-white">{post.videoConfig.totalDuration}s</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Aspect Ratio:</span>
                        <span className="font-mono font-bold text-white">{post.videoConfig.aspectRatio} (Vertical)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Theme:</span>
                        <span className="capitalize font-mono text-cyan-400">{post.videoConfig.theme.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Audio Track:</span>
                        <span className="capitalize text-slate-300">{post.videoConfig.audioBgm.replace('-', ' ')}</span>
                      </div>
                    </div>

                    {onSelectPostForStudio && (
                      <button
                        type="button"
                        onClick={() => onSelectPostForStudio(post)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect in Video Studio</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reject Input Panel */}
                {rejectingPostId === post.id && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                    <label className="text-xs font-bold text-rose-300">
                      Editorial Feedback / Revision Note:
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="e.g. Change hook to mention Q4 ROI or shorten scene 2..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setRejectingPostId(null)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectSubmit(post)}
                        className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer"
                      >
                        Submit Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    {/* Rejection button */}
                    {!isPublished && rejectingPostId !== post.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingPostId(post.id);
                          setRejectReason('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                      >
                        Request Changes
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve button */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleApprove(post)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Video</span>
                      </button>
                    )}

                    {/* Publish immediately button */}
                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() => handleApproveAndPublishNow(post)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Approve & Publish Now</span>
                      </button>
                    )}

                    {isPublished && (
                      <span className="text-xs text-slate-400 font-mono">
                        Published at {post.publishedAt}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
