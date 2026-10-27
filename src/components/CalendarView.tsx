import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Video, 
  Send, 
  ChevronRight, 
  FileSpreadsheet, 
  Download,
  Eye,
  X,
  Globe,
  Sparkles,
  ShieldCheck,
  FileText,
  Volume2,
  Share2
} from 'lucide-react';
import { SocialPostItem, SocialPlatform, PostStatus } from '../types/social';
import { filterPosts } from '../utils/schedulerEngine';
import { PLATFORMS_INFO } from '../utils/excelParser';

interface CalendarViewProps {
  posts: SocialPostItem[];
  selectedPostId: string;
  onSelectPost: (post: SocialPostItem) => void;
  onOpenTemplateModal?: () => void;
  onExportExcel?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  selectedPostId,
  onSelectPost,
  onOpenTemplateModal,
  onExportExcel,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [inspectingPost, setInspectingPost] = useState<SocialPostItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'script' | 'times' | 'copy' | 'prompts' | 'source'>('overview');

  const filteredPosts = filterPosts(posts, searchQuery, statusFilter, platformFilter);
  const activePost = posts.find(p => p.id === selectedPostId) || posts[0];

  // November 2026 starts on Sunday Nov 1
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header with Title and Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Aura432Hz 30-Day Content Campaign Calendar
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Nov 1 – Nov 30 • 29 Columns Mapped
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any day to select active package, inspect all 29 fields, or configure platform captions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activePost && (
            <button
              type="button"
              onClick={() => setInspectingPost(activePost)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Day {activePost.dayIndex} (29 Fields)</span>
            </button>
          )}

          {onOpenTemplateModal && (
            <button
              type="button"
              onClick={onOpenTemplateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ingestion & Templates</span>
            </button>
          )}

          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Download 29-column workbook (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Export .xlsx</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topic, hook, or keywords..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready (Rendered)</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="draft">Draft (Pending Production)</option>
          </select>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Platform:</span>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Platforms</option>
            <option value="youtube">YouTube Shorts</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram Reels</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono ml-auto">
          Showing {filteredPosts.length} of {posts.length} days
        </span>
      </div>

      {/* Mode 1: Month Calendar Grid */}
      {viewMode === 'calendar' ? (
        <div className="overflow-x-auto">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px] mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {daysOfWeek.map(d => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grid Cells: Nov 2026 starts on Sunday (index 0) */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {filteredPosts.map(post => {
              const isSelected = post.id === selectedPostId;
              const isPublished = post.status === 'published';
              const isApproved = post.status === 'approved';
              const isReady = post.status === 'ready';

              return (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className={`min-h-[110px] p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group relative ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Day Number and Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      Day {post.dayIndex}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isPublished
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isReady
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {post.status === 'draft' ? 'PHASE 1 DRAFT' : post.status}
                    </span>
                  </div>

                  {/* Topic and Time */}
                  <div className="my-1.5">
                    <p className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                      {post.topic}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      🇪🇬 {post.postingTimes?.instagram || post.time} Cairo
                    </span>
                  </div>

                  {/* Platform Icons & Quick Inspect Trigger */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      {['facebook', 'instagram', 'tiktok', 'youtube'].map(p => (
                        <span
                          key={p}
                          title={p.toUpperCase()}
                          className={`w-2 h-2 rounded-full ${
                            p === 'youtube'
                              ? 'bg-red-500'
                              : p === 'tiktok'
                              ? 'bg-cyan-400'
                              : p === 'instagram'
                              ? 'bg-purple-400'
                              : 'bg-blue-500'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingPost(post);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-cyan-400 hover:underline transition-opacity flex items-center gap-0.5"
                    >
                      <Eye className="w-2.5 h-2.5" />
                      <span>29 cols</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mode 2: Table / List View */
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Day / Date</th>
                <th className="p-3">Cairo Time</th>
                <th className="p-3">Topic & Core Hook</th>
                <th className="p-3">Phase & Focus</th>
                <th className="p-3">Status</th>
                <th className="p-3">Boost</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {filteredPosts.map(post => {
                const isSelected = post.id === selectedPostId;
                return (
                  <tr
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white whitespace-nowrap">
                      Day {post.dayIndex} ({post.date})
                    </td>
                    <td className="p-3 font-mono text-cyan-400 whitespace-nowrap">
                      {post.postingTimes?.instagram || post.time}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">{post.topic}</div>
                      <div className="text-[11px] text-slate-400 truncate">{post.coreHook}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-xs text-slate-300">{post.campaignPhase || 'Phase 1'}</div>
                      <div className="text-[10px] text-cyan-400">{post.contentFocus || post.category}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {post.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        post.boostStatus === 'Boost' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {post.boostStatus || 'Organic'}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setInspectingPost(post);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs"
                      >
                        Inspect 29 Fields
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectPost(post);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors cursor-pointer text-xs"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 29-Column Day Inspector Modal */}
      {inspectingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Day {inspectingPost.dayIndex} — 29-Column Content Package Inspector
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      RAW SOURCE PRESERVED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {inspectingPost.date} ({inspectingPost.rawSourceRecord?.dayOfWeek || 'Sunday'}) • {inspectingPost.campaignPhase}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingPost(null)}
                aria-label="Close inspector"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setInspectorTab('overview')}
                className={`px-3 py-2 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  inspectorTab === 'overview' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Overview & Focus
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('script')}
                className={`px-3 py-2 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  inspectorTab === 'script' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Script & Pronunciation
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('times')}
                className={`px-3 py-2 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  inspectorTab === 'times' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Times & Multi-Zone
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('copy')}
                className={`px-3 py-2 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  inspectorTab === 'copy' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                4. Captions & Hashtags
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('prompts')}
                className={`px-3 py-2 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  inspectorTab === 'prompts' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                5. Gemini Creative Directives
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('source')}
                className={`px-3 py-2 border-b-2 font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  inspectorTab === 'source' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                6. Source Immutability
              </button>
            </div>

            {/* Inspector Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {inspectorTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Video # / Day</div>
                      <div className="text-lg font-bold text-white font-mono">Day {inspectingPost.dayIndex}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Scheduled Date</div>
                      <div className="text-sm font-semibold text-slate-200 font-mono">{inspectingPost.date}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Campaign Phase</div>
                      <div className="text-sm font-semibold text-cyan-400">{inspectingPost.campaignPhase}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Content Focus / Pillar</div>
                      <div className="text-sm font-semibold text-slate-200">{inspectingPost.contentFocus}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Video Title</div>
                      <div className="text-sm font-bold text-white leading-snug">{inspectingPost.topic}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Video Duration</div>
                      <div className="text-sm font-semibold text-slate-200 font-mono">{inspectingPost.videoDuration || 30} seconds</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Boost Status & Rationale</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {inspectingPost.boostStatus || 'Organic'}
                        </span>
                        <span className="text-slate-400 text-[11px]">{inspectingPost.boostRationale}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'script' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">Opening Hook (0–3 Seconds)</span>
                      <span className="text-[10px] text-slate-500">First frame audio & kinetic text</span>
                    </div>
                    <p className="text-sm font-medium text-white italic">
                      "{inspectingPost.coreHook}"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Full Voiceover Narration Script</span>
                      <span className="text-[10px] font-mono text-slate-500">{inspectingPost.fullScript.length} characters</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {inspectingPost.fullScript}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Spoken URL Pronunciation (Phonetic Audio Guide)</span>
                    </div>
                    <p className="text-xs font-mono text-emerald-300">
                      "{inspectingPost.spokenUrlPronunciation || 'Aura four thirty-two hertz dot com'}"
                    </p>
                  </div>
                </div>
              )}

              {inspectorTab === 'times' && (
                <div className="space-y-4">
                  {/* Platform Posting Times */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Platform Scheduled Slots
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-purple-400">Instagram Reels</div>
                        <div className="text-base font-bold text-white font-mono mt-1">
                          {inspectingPost.postingTimes?.instagram || '18:00'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-red-400">YouTube Shorts</div>
                        <div className="text-base font-bold text-white font-mono mt-1">
                          {inspectingPost.postingTimes?.youtube || '19:30'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-blue-400">Facebook</div>
                        <div className="text-base font-bold text-white font-mono mt-1">
                          {inspectingPost.postingTimes?.facebook || '20:00'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-cyan-400">TikTok</div>
                        <div className="text-base font-bold text-white font-mono mt-1">
                          {inspectingPost.postingTimes?.tiktok || '21:00'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Regional Time References */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Regional Time Reference Alignment</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30">
                        <div className="text-[10px] font-bold text-emerald-400">🇪🇬 Master Scheduler Time (Egypt)</div>
                        <div className="text-sm font-semibold text-white mt-1">
                          {inspectingPost.regionalTimes?.egypt || '20:00 Cairo (UTC+2)'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400">🇬🇧 UK Reference Time</div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">
                          {inspectingPost.regionalTimes?.uk || '18:00 London (GMT)'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400">🇺🇸 US Eastern Reference Time</div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">
                          {inspectingPost.regionalTimes?.usEastern || '13:00 New York (EST)'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] font-bold text-slate-400">🇺🇸 US Pacific Reference Time</div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">
                          {inspectingPost.regionalTimes?.usPacific || '10:00 Los Angeles (PST)'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'copy' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">Master Caption (Single Source of Truth)</span>
                      <span className="text-[10px] font-mono text-slate-500">{(inspectingPost.masterCaption || '').length} chars</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {inspectingPost.masterCaption}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-red-400">YouTube Shorts Title (&lt;100 Chars)</div>
                    <p className="text-xs font-semibold text-white">
                      {inspectingPost.youtubeShortsTitle}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Call to Action (CTA)</div>
                    <p className="text-xs text-slate-200">{inspectingPost.callToAction}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Hashtags</div>
                    <p className="text-xs font-mono text-cyan-300">{inspectingPost.hashtagsRaw}</p>
                  </div>
                </div>
              )}

              {inspectorTab === 'prompts' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini Generative Video Prompt (Preserved Verbatim)</span>
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      {inspectingPost.geminiPrompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Visual Guidelines</div>
                      <p className="text-xs text-slate-300">{inspectingPost.visualGuidelines}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Color & Aesthetic Guidelines</div>
                      <p className="text-xs text-slate-300">{inspectingPost.colorAestheticGuidelines}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Voice & Cinematic Profile</div>
                      <p className="text-xs text-slate-300">{inspectingPost.voiceCinematicGuidelines}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Publishing & Safety Notes</div>
                      <p className="text-xs text-slate-300">{inspectingPost.publishingSafetyNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'source' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Raw Untouched Ingested JSON Row</span>
                      <span className="text-[10px] font-mono text-emerald-400">Immutability Protected</span>
                    </div>
                    <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                      {JSON.stringify(inspectingPost.rawSourceRecord, null, 2)}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Content Checksum Hash</div>
                      <div className="text-xs font-mono text-cyan-400 mt-1 truncate">
                        {inspectingPost.contentHash || 'hash-aura-day-01'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Current Phase 1 Status</div>
                      <div className="text-xs font-mono text-white mt-1">
                        {inspectingPost.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
              <span className="text-xs text-slate-500 font-mono">
                Preserving 29 of 29 workbook fields
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPost(inspectingPost);
                    setInspectingPost(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Load in Video Studio & Cross-Poster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
