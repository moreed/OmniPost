import React from 'react';
import { 
  Share2, 
  FileSpreadsheet, 
  Download, 
  Zap, 
  Video, 
  BarChart2, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Key,
  Image as ImageIcon,
  Cloud
} from 'lucide-react';
import { ScheduleStats } from '../utils/schedulerEngine';

interface NavbarProps {
  stats: ScheduleStats;
  isAutomationEnabled: boolean;
  isAdminAuthenticated: boolean;
  currentView: 'readiness' | 'studio' | 'accounts' | 'analytics' | 'approvals';
  onChangeView: (view: 'readiness' | 'studio' | 'accounts' | 'analytics' | 'approvals') => void;
  onOpenImport: () => void;
  onExportExcel: () => void;
  onOpenAutomation: () => void;
  onOpenCPanel: () => void;
  onAddNewDay: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  isAutomationEnabled,
  isAdminAuthenticated,
  currentView,
  onChangeView,
  onOpenImport,
  onExportExcel,
  onOpenAutomation,
  onOpenCPanel,
  onAddNewDay,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 font-black text-lg">
            OP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                OmniPost • Aura432Hz
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PHASE 1: PREPARATION
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-Platform Video & Image Studio • 29-Column Automation
            </p>
          </div>
        </div>

        {/* View Switcher: Phase 1 Audit vs Studio vs Social Logins vs Approvals vs Analytics */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onChangeView('readiness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'readiness'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Phase 1 Audit</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Studio Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('accounts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'accounts'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-400" />
            <span>Social Logins (4)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('approvals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'approvals'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approval Queue</span>
            {stats.pendingReview > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                {stats.pendingReview}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onChangeView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'analytics'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Import / Template Studio Hub */}
          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
            title="Open 29-Column Ingestion & Template Hub"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>29-Col Ingestion</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
            title="Export full 29-column workbook to Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Export .xlsx</span>
          </button>

          <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1" title="Cloudflare R2 Object Storage Active">
              <Cloud className="w-3 h-3" />
              <span>R2 CDN</span>
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1" title="Firebase Authentication & Firestore ABAC Active">
              <Lock className="w-3 h-3" />
              <span>Firebase Auth</span>
            </span>
          </div>

          {/* Admin cPanel Button */}
          <button
            type="button"
            onClick={onOpenCPanel}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isAdminAuthenticated
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30 shadow-sm shadow-purple-500/10'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500/50'
            }`}
            title="Open Admin cPanel (2FA) for Social Connections & Cloudflare R2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>cPanel (2FA)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
