import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Calendar,
  Clock,
  Send,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Sliders,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SocialPostItem, SocialPlatform } from '../types/social';
import {
  calculatePostMetrics,
  calculatePlatformAggregates,
  auditPostContent,
  PostPerformanceMetric,
  ContentAuditResult,
} from '../utils/performanceEngine';
import { executeSimulatedPublish } from '../utils/schedulerEngine';

interface PerformanceDashboardProps {
  posts: SocialPostItem[];
  selectedPost: SocialPostItem;
  onSelectPost: (post: SocialPostItem) => void;
  onUpdatePost: (updated: SocialPostItem) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  posts,
  selectedPost,
  onSelectPost,
  onUpdatePost,
}) => {
  const [metricTab, setMetricTab] = useState<'views' | 'likes' | 'shares' | 'all'>('all');
  const [selectedDayPost, setSelectedDayPost] = useState<SocialPostItem>(selectedPost);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleDate, setScheduleDate] = useState<string>(selectedDayPost.date);
  const [scheduleTime, setScheduleTime] = useState<string>(selectedDayPost.time);
  const [appliedRecs, setAppliedRecs] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Keep selectedDayPost synced if selectedPost prop changes
  React.useEffect(() => {
    setSelectedDayPost(selectedPost);
    setScheduleDate(selectedPost.date);
    setScheduleTime(selectedPost.time);
  }, [selectedPost]);

  const metrics = calculatePostMetrics(posts);
  const platformData = calculatePlatformAggregates(metrics);
  const audit = auditPostContent(selectedDayPost);

  // Overall totals
  const totalViews = metrics.reduce((acc, m) => acc + m.views, 0);
  const totalLikes = metrics.reduce((acc, m) => acc + m.likes, 0);
  const totalShares = metrics.reduce((acc, m) => acc + m.shares, 0);
  const avgEngagement = (metrics.reduce((acc, m) => acc + m.engagementRate, 0) / (metrics.length || 1)).toFixed(2);

  // Chart data formatting
  const chartData = metrics.map(m => ({
    day: `Nov ${m.dayIndex}`,
    Views: m.views,
    Likes: m.likes,
    Shares: m.shares,
    Engagement: `${m.engagementRate}%`,
  }));

  // Handle Apply Recommendation
  const handleApplyRecommendation = (recId: string, fix?: string) => {
    if (!fix) return;
    setAppliedRecs(prev => ({ ...prev, [recId]: true }));

    const updated: SocialPostItem = {
      ...selectedDayPost,
      coreHook: fix,
      platformContents: {
        ...selectedDayPost.platformContents,
        youtube: {
          ...selectedDayPost.platformContents.youtube,
          caption: `${selectedDayPost.platformContents.youtube.caption}\n\n${fix}`,
        },
      },
    };

    setSelectedDayPost(updated);
    onUpdatePost(updated);

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
  };

  // Submit / Publish Now
  const handleSubmitPublish = () => {
    const updated = executeSimulatedPublish(selectedDayPost);
    setSelectedDayPost(updated);
    onUpdatePost(updated);

    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Confirm Reschedule
  const handleConfirmSchedule = () => {
    const updated: SocialPostItem = {
      ...selectedDayPost,
      date: scheduleDate,
      time: scheduleTime,
      status: 'scheduled',
      publishLogs: [
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          platform: 'youtube',
          status: 'queued',
          message: `Rescheduled to ${scheduleDate} at ${scheduleTime} via Performance Center`,
        },
        ...selectedDayPost.publishLogs,
      ],
    };

    setSelectedDayPost(updated);
    onUpdatePost(updated);
    setIsScheduleModalOpen(false);

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Copy share link
  const handleCopyShareLink = () => {
    const url = `https://omnipost.studio/share/report/nov-${selectedDayPost.dayIndex}?t=${Date.now()}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</span>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {(totalViews / 1000).toFixed(1)}k
            </div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +24% vs last week
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Likes</span>
            <div className="text-2xl font-black font-mono text-pink-400 mt-1">
              {(totalLikes / 1000).toFixed(1)}k
            </div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +18.2% viral boost
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Shares</span>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">
              {(totalShares / 1000).toFixed(1)}k
            </div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> 1:4 save ratio
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg. Engagement</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {avgEngagement}%
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
              Across 6 platforms
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 30-Day Engagement Time Series (AreaChart) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Simulated 30-Day Engagement Trend (Nov 1 - Nov 30)
              </h3>
              <p className="text-xs text-slate-400">
                Daily projected views, likes, and shares across all scheduled video releases
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['all', 'views', 'likes', 'shares'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMetricTab(tab)}
                  className={`px-2.5 py-1 rounded text-xs capitalize cursor-pointer transition-colors ${
                    metricTab === tab
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Container */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                {(metricTab === 'all' || metricTab === 'views') && (
                  <Area
                    type="monotone"
                    dataKey="Views"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                )}
                {(metricTab === 'all' || metricTab === 'likes') && (
                  <Area
                    type="monotone"
                    dataKey="Likes"
                    stroke="#ec4899"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLikes)"
                  />
                )}
                {(metricTab === 'all' || metricTab === 'shares') && (
                  <Area
                    type="monotone"
                    dataKey="Shares"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorShares)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Platform Performance Comparison (BarChart) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Platform Share of Reach
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated views distribution across connected networks
            </p>
          </div>

          <div className="w-full h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="displayName" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={75} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="views" radius={[0, 6, 6, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Video Preview, Audit, Recommendations & Actions Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                AUDIT & PREVIEW • DAY {selectedDayPost.dayIndex}
              </span>
              <span className="text-xs text-slate-400">{selectedDayPost.date}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {selectedDayPost.topic}
            </h2>
          </div>

          {/* Action Hub Buttons: Submit, Schedule, Share */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reschedule Slot</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Share Preview</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitPublish}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Publish Now</span>
            </button>
          </div>
        </div>

        {/* 3-Column Layout: Video Preview, Content Audit, AI Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Video Preview Card */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between gap-4">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-white">Video Asset Preview</span>
              <span className="font-mono text-cyan-400">{selectedDayPost.videoConfig.aspectRatio}</span>
            </div>

            {/* Simulated Video Frame */}
            <div className="w-full aspect-[9/16] max-h-[360px] rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-cyan-500/30 p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl group">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/20">
                  DAY {selectedDayPost.dayIndex}
                </span>
                <span className="text-slate-400">{selectedDayPost.videoConfig.totalDuration}s</span>
              </div>

              <div className="text-center my-auto space-y-2">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  🚨 THE HOOK
                </div>
                <p className="text-sm font-bold text-white leading-snug drop-shadow-md">
                  {selectedDayPost.coreHook}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Scene 1/4</span>
                  <span>4K HD 60fps</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full w-2/3" />
                </div>
              </div>
            </div>

            <div className="w-full text-center">
              <span className="text-xs text-slate-400 block truncate">
                Theme: <strong className="text-slate-200 capitalize">{selectedDayPost.videoConfig.theme}</strong>
              </span>
            </div>
          </div>

          {/* Column 2: Content & Algorithmic Audit */}
          <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Algorithmic Content Audit
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Platform retention & quality score
                </p>
              </div>

              <div className="w-12 h-12 rounded-full border-2 border-emerald-400/80 bg-emerald-500/10 flex flex-col items-center justify-center font-mono text-emerald-400 shadow-lg shadow-emerald-500/10">
                <span className="text-sm font-black">{audit.overallScore}</span>
                <span className="text-[8px] text-emerald-500 uppercase font-bold">/100</span>
              </div>
            </div>

            {/* Score Breakdowns */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Hook</span>
                <span className="font-mono font-bold text-cyan-400">{audit.hookScore}%</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Retention</span>
                <span className="font-mono font-bold text-purple-400">{audit.retentionScore}%</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Fit</span>
                <span className="font-mono font-bold text-emerald-400">{audit.platformFitScore}%</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quality Verification Checklist:
              </span>
              {audit.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                >
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-200">{item.title}</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: AI Recommendations & 1-Click Fixes */}
          <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  AI Optimization Recommendations
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Actionable tweaks to increase virality & CTR
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {audit.recommendations.map(rec => {
                const isApplied = appliedRecs[rec.id];

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            rec.impact === 'high' ? 'bg-rose-400' : 'bg-amber-400'
                          }`}
                        />
                        {rec.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {rec.impact} impact
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {rec.advice}
                    </p>

                    {rec.suggestedFix && (
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono text-[10px] text-cyan-300 select-all">
                        {rec.suggestedFix}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={isApplied}
                        onClick={() => handleApplyRecommendation(rec.id, rec.suggestedFix)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
                        }`}
                      >
                        {isApplied ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-purple-400" />}
                        <span>{isApplied ? 'Applied to Script' : 'Apply 1-Click Fix'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Reschedule Slot Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Reschedule Day {selectedDayPost.dayIndex} Video
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select the new dispatch date and time slot for multi-platform distribution.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Date:</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Time Slot (HH:mm):</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Preview Link Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                Share Performance & Video Preview
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Generate a shareable public review link for your team or clients to preview Day {selectedDayPost.dayIndex}&apos;s video and projected engagement.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">Shareable Review Link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://omnipost.studio/share/report/nov-${selectedDayPost.dayIndex}`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-400 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-white">Included in Preview:</div>
              <div>• 4K Animated Canvas Video Preview</div>
              <div>• Recharts Engagement Graphs & Projections</div>
              <div>• Platform-Tailored Captions for TikTok, Reels, Shorts & LinkedIn</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
