import React from 'react';
import { X, CheckCircle2, Clock, PlayCircle, ShieldCheck, Zap, Activity, ExternalLink } from 'lucide-react';
import { SocialPostItem, SocialPlatform } from '../types/social';
import { PLATFORMS_INFO } from '../utils/excelParser';

interface AutoSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: SocialPostItem[];
  isAutomationEnabled: boolean;
  onToggleAutomation: () => void;
  onRunImmediateDailyTick: () => void;
}

export const AutoSchedulerModal: React.FC<AutoSchedulerModalProps> = ({
  isOpen,
  onClose,
  posts,
  isAutomationEnabled,
  onToggleAutomation,
  onRunImmediateDailyTick,
}) => {
  if (!isOpen) return null;

  const nextScheduledPost = posts.find(p => p.status === 'scheduled' || p.status === 'ready');
  const allLogs = posts.flatMap(p => p.publishLogs || []).slice(0, 15);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Automated Daily Cross-Posting Engine
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous daily video generation & multi-platform dispatch starting 1 Nov
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Status Toggle Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isAutomationEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  Daily Automation Service:
                  <span
                    className={isAutomationEnabled ? 'text-emerald-400' : 'text-slate-400'}
                  >
                    {isAutomationEnabled ? 'ACTIVE & ARMED' : 'PAUSED'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Next automated dispatch: {nextScheduledPost ? `${nextScheduledPost.date} at ${nextScheduledPost.time}` : 'All 30 days published'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleAutomation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isAutomationEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {isAutomationEnabled ? 'Pause Automation' : 'Enable Automation'}
              </button>

              <button
                type="button"
                onClick={onRunImmediateDailyTick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-cyan-400" />
                Simulate Today&apos;s Auto-Post
              </button>
            </div>
          </div>

          {/* Connected Platform Endpoints */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Connected Destination APIs (6 of 6 Active)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(PLATFORMS_INFO) as SocialPlatform[]).map(p => {
                const info = PLATFORMS_INFO[p];
                return (
                  <div
                    key={p}
                    className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-medium text-white">{info.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">READY</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Dispatch Activity Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Recent Dispatch & Automation Logs
            </h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 max-h-[220px] overflow-y-auto space-y-2">
              {allLogs.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">
                  No automated logs yet. Click &quot;Simulate Today&apos;s Auto-Post&quot; to test the engine.
                </div>
              ) : (
                allLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400">{log.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase">
                        {log.platform}
                      </span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                    {log.metrics && (
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
                        +{log.metrics.views} views
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
