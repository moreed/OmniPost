import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { VideoStudio } from './components/VideoStudio';
import { ImageStudio } from './components/ImageStudio';
import { PlatformCrossPoster } from './components/PlatformCrossPoster';
import { ExcelImportModal } from './components/ExcelImportModal';
import { AutoSchedulerModal } from './components/AutoSchedulerModal';
import { AdminCPanel } from './components/AdminCPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { ApprovalQueue } from './components/ApprovalQueue';
import { Phase1ReadinessReport } from './components/Phase1ReadinessReport';
import { SocialLoginSection } from './components/SocialLoginSection';
import { SocialPostItem } from './types/social';
import { AdminSettings } from './types/admin';
import { generateDefaultNovemberCalendar } from './utils/defaultCalendar';
import { calculateScheduleStats, executeSimulatedPublish } from './utils/schedulerEngine';
import { exportAura29ColumnWorkbook } from './utils/excelParser';
import { loadAdminSettings, saveAdminSettings } from './utils/adminStorage';
import { 
  Sparkles, 
  Calendar, 
  Video, 
  Send, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  BarChart2, 
  AlertCircle,
  Image as ImageIcon,
  Key,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentView, setCurrentView] = useState<'readiness' | 'studio' | 'accounts' | 'analytics' | 'approvals'>('readiness');
  const [generatorMode, setGeneratorMode] = useState<'video' | 'image'>('video');
  const [posts, setPosts] = useState<SocialPostItem[]>(() => generateDefaultNovemberCalendar());
  const [selectedPostId, setSelectedPostId] = useState<string>(() => posts[0]?.id || 'aura-pkg-day-01');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importedFileFromDrag, setImportedFileFromDrag] = useState<File | null>(null);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState<boolean>(false);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState<boolean>(false); // Strict Phase 1
  const [isBatchRendering, setIsBatchRendering] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWindowDragging, setIsWindowDragging] = useState<boolean>(false);

  // Admin cPanel state
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => loadAdminSettings());
  const [isCPanelOpen, setIsCPanelOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  const activePost = posts.find(p => p.id === selectedPostId) || posts[0];
  const stats = calculateScheduleStats(posts);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenCPanel = () => {
    if (adminSettings.isAuthenticated) {
      setIsCPanelOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    const updated = { ...adminSettings, isAuthenticated: true, lastLoginTime: new Date().toLocaleTimeString() };
    setAdminSettings(updated);
    saveAdminSettings(updated);
    setIsCPanelOpen(true);
    showToast('Admin Authenticated • cPanel Unlocked');
  };

  const handleAdminLogout = () => {
    const updated = { ...adminSettings, isAuthenticated: false };
    setAdminSettings(updated);
    saveAdminSettings(updated);
    setIsCPanelOpen(false);
    showToast('Admin Session Locked');
  };

  const handleUpdateAdminSettings = (updated: AdminSettings) => {
    setAdminSettings(updated);
    saveAdminSettings(updated);
  };

  // Global window drag and drop listener for Excel files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        setIsWindowDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        setImportedFileFromDrag(file);
        setIsImportModalOpen(true);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Handle post update from VideoStudio, ImageStudio, or PlatformCrossPoster
  const handleUpdatePost = (updated: SocialPostItem) => {
    setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  // Handle new import from Excel
  const handleImportComplete = (importedPosts: SocialPostItem[]) => {
    setPosts(importedPosts);
    if (importedPosts.length > 0) {
      setSelectedPostId(importedPosts[0].id);
    }
    showToast(`Successfully ingested ${importedPosts.length} daily packages with 29-column schema!`);
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Export current schedule to 29-column Excel
  const handleExportExcel = () => {
    exportAura29ColumnWorkbook(posts, 'populated', 'Aura432Hz_30_video_master_content_calendar_.xlsx');
    showToast('Downloaded Aura432Hz 29-Column Master Excel Workbook!');
  };

  // Phase 1 Guarded Batch Render handler
  const handleBatchRenderAll = () => {
    showToast('Phase 1 Guard: Ingestion & preparation active. Video generation is locked until Milestone 2 gate approval.');
  };

  // Phase 1 Guarded Auto-Post trigger
  const handleRunImmediateDailyTick = () => {
    showToast('Phase 1 Guard: External social media dispatch is locked until Milestone 2 approval.');
  };

  const handleAddNewDay = () => {
    const nextDayIndex = posts.length + 1;
    const dayStr = nextDayIndex < 10 ? `0${nextDayIndex}` : `${nextDayIndex}`;
    const newPost: SocialPostItem = {
      ...posts[0],
      id: `aura-pkg-day-${dayStr}`,
      dayIndex: nextDayIndex,
      date: `2026-11-${dayStr}`,
      topic: `Day ${nextDayIndex}: Sound Frequencies & Rest`,
      coreHook: `Notice how your nervous system shifts in 10 seconds of 432Hz`,
      status: 'draft',
      rawSourceRecord: {
        'Video #': nextDayIndex,
        'Date': `2026-11-${dayStr}`,
        'Day': 'Sunday',
        'Video Title': `Day ${nextDayIndex}: Sound Frequencies & Rest`,
      },
      editedFields: [],
    };
    setPosts(prev => [...prev, newPost]);
    setSelectedPostId(newPost.id);
    showToast(`Added Day ${nextDayIndex} to campaign calendar!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Full-Screen Drag and Drop Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-cyan-950/80 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4">
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white">
            Drop your Aura432Hz Excel or CSV file here
          </h2>
          <p className="text-sm text-cyan-300 mt-2 max-w-md">
            OmniPost will validate all 29 columns on sheet `30 Video Posts`, preserve raw source records, and organize the 30-day campaign calendar.
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce text-xs border border-cyan-400 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        stats={stats}
        isAutomationEnabled={isAutomationEnabled}
        isAdminAuthenticated={adminSettings.isAuthenticated}
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenImport={() => {
          setImportedFileFromDrag(null);
          setIsImportModalOpen(true);
        }}
        onExportExcel={handleExportExcel}
        onOpenAutomation={() => setIsAutomationModalOpen(true)}
        onOpenCPanel={handleOpenCPanel}
        onAddNewDay={handleAddNewDay}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Workflow Overview & Quick Action Card */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-indigo-950/30 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Milestone 1 — Foundation & Campaign Preparation Active
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {stats.total}/30 Days • 29 Columns Mapped
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Aura432Hz Cross-Posting Automation & Media Studio
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create video and image content with identical style presets and settings. Authenticate social media accounts for Facebook, Instagram, TikTok, and YouTube, with all 29 workbook fields preserved in Africa/Cairo master time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'accounts' ? 'studio' : 'accounts')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'accounts'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700'
              }`}
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span>{currentView === 'accounts' ? 'Back to Studio' : 'Social Logins (4)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImportedFileFromDrag(null);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>29-Col Ingestion Hub</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCPanel}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                adminSettings.isAuthenticated
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 shadow-sm shadow-purple-500/10'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700 hover:border-purple-400/50'
              }`}
              title="Admin cPanel (2FA) for connecting Facebook, Instagram, TikTok, and YouTube"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Admin cPanel (2FA)</span>
            </button>
          </div>
        </div>

        {/* View 1: Phase 1 Readiness Audit */}
        {currentView === 'readiness' && (
          <div className="space-y-6">
            <Phase1ReadinessReport
              posts={posts}
              adminSettings={adminSettings}
              onOpenImportModal={() => {
                setImportedFileFromDrag(null);
                setIsImportModalOpen(true);
              }}
              onOpenCPanel={handleOpenCPanel}
            />

            {/* Campaign Calendar Overview */}
            <CalendarView
              posts={posts}
              selectedPostId={selectedPostId}
              onSelectPost={p => {
                setSelectedPostId(p.id);
                setCurrentView('studio');
              }}
              onOpenTemplateModal={() => {
                setImportedFileFromDrag(null);
                setIsImportModalOpen(true);
              }}
              onExportExcel={handleExportExcel}
            />
          </div>
        )}

        {/* View 2: Social Media Platform Login Section */}
        {currentView === 'accounts' && (
          <div className="space-y-6">
            <SocialLoginSection
              adminSettings={adminSettings}
              onUpdateAdminSettings={handleUpdateAdminSettings}
              onOpenCPanel={handleOpenCPanel}
            />
          </div>
        )}

        {/* View 3: Analytics Dashboard */}
        {currentView === 'analytics' && (
          <PerformanceDashboard
            posts={posts}
            selectedPost={activePost}
            onSelectPost={p => setSelectedPostId(p.id)}
            onUpdatePost={handleUpdatePost}
          />
        )}

        {/* View 4: Approval Queue */}
        {currentView === 'approvals' && (
          <ApprovalQueue
            posts={posts}
            onUpdatePost={handleUpdatePost}
            onUpdateAllPosts={setPosts}
            onSelectPostForStudio={p => {
              setSelectedPostId(p.id);
              setCurrentView('studio');
            }}
          />
        )}

        {/* View 5: Studio Workspace (Video & Image Generator + Cross-Poster + Calendar) */}
        {currentView === 'studio' && (
          <>
            {/* Quick Day Selector Strip */}
            <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 overflow-x-auto gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white">Daily Package:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {posts.slice(0, 15).map(post => {
                  const isSelected = post.id === selectedPostId;
                  const isReady = post.status === 'ready' || post.status === 'published';
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setSelectedPostId(post.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          post.status === 'published'
                            ? 'bg-purple-400'
                            : isReady
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span>Day {post.dayIndex}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generator Mode Switcher: Video Studio vs Image Studio */}
            <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGeneratorMode('video')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    generatorMode === 'video'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video Generator (Motion & Audio)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGeneratorMode('image')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    generatorMode === 'image'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Generator (Same Style & Settings)</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-3">
                <span className="font-mono text-cyan-400">Day {activePost.dayIndex}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium truncate max-w-xs">{activePost.topic}</span>
              </div>
            </div>

            {/* Studio Workspace: Active Generator Section */}
            <div className="space-y-6">
              {generatorMode === 'video' ? (
                <VideoStudio
                  post={activePost}
                  onUpdatePost={handleUpdatePost}
                  onBatchRenderAll={handleBatchRenderAll}
                  isBatchRendering={isBatchRendering}
                />
              ) : (
                <ImageStudio
                  post={activePost}
                  onUpdatePost={handleUpdatePost}
                />
              )}

              {/* Multi-Platform Details & Cross-Poster Section */}
              <PlatformCrossPoster
                post={activePost}
                onUpdatePost={handleUpdatePost}
              />

              {/* Embedded Social Media Account Login Section */}
              <SocialLoginSection
                adminSettings={adminSettings}
                onUpdateAdminSettings={handleUpdateAdminSettings}
                onOpenCPanel={handleOpenCPanel}
              />
            </div>

            {/* 30-Day Calendar Schedule Grid */}
            <div className="pt-2">
              <CalendarView
                posts={posts}
                selectedPostId={selectedPostId}
                onSelectPost={p => setSelectedPostId(p.id)}
                onOpenTemplateModal={() => {
                  setImportedFileFromDrag(null);
                  setIsImportModalOpen(true);
                }}
                onExportExcel={handleExportExcel}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          OmniPost • Aura432Hz Cross-Platform Publishing Platform • Video & Image Studio
        </p>
      </footer>

      {/* Modals */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportedFileFromDrag(null);
        }}
        onImportComplete={handleImportComplete}
        existingPosts={posts}
        initialFile={importedFileFromDrag}
      />

      <AutoSchedulerModal
        isOpen={isAutomationModalOpen}
        onClose={() => setIsAutomationModalOpen(false)}
        posts={posts}
        isAutomationEnabled={isAutomationEnabled}
        onToggleAutomation={() => {
          showToast('Phase 1 Guard: Recurring background scheduler activates upon Milestone 2 approval.');
        }}
        onRunImmediateDailyTick={handleRunImmediateDailyTick}
      />

      {/* Admin cPanel for Social Media Platform Connections */}
      <AdminCPanel
        isOpen={isCPanelOpen}
        onClose={() => setIsCPanelOpen(false)}
        adminSettings={adminSettings}
        onUpdateAdminSettings={handleUpdateAdminSettings}
        onLogout={handleAdminLogout}
        posts={posts}
        onUpdatePost={handleUpdatePost}
        onUpdateAllPosts={setPosts}
        onSelectPostForStudio={p => {
          setSelectedPostId(p.id);
          setIsCPanelOpen(false);
          setCurrentView('studio');
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
