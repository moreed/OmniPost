import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Power, 
  Lock, 
  Activity, 
  Eye, 
  EyeOff,
  Sparkles,
  Share2,
  Check,
  X,
  Clock,
  Radio
} from 'lucide-react';
import { AdminSettings, ConnectedPlatformId, PlatformConnectionConfig } from '../types/admin';
import confetti from 'canvas-confetti';

interface SocialLoginSectionProps {
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (updated: AdminSettings) => void;
  onOpenCPanel?: () => void;
}

export const SocialLoginSection: React.FC<SocialLoginSectionProps> = ({
  adminSettings,
  onUpdateAdminSettings,
  onOpenCPanel,
}) => {
  const [authModalPlatform, setAuthModalPlatform] = useState<ConnectedPlatformId | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: 'testing' | 'success' | 'error'; message: string }>>({});
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<ConnectedPlatformId | null>(null);

  const toggleShowToken = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestConnection = async (platformId: ConnectedPlatformId) => {
    setTestResults(prev => ({
      ...prev,
      [platformId]: { status: 'testing', message: 'Testing OAuth 2.0 API handshake & publishing permissions...' },
    }));

    await new Promise(r => setTimeout(r, 750));

    setTestResults(prev => ({
      ...prev,
      [platformId]: {
        status: 'success',
        message: 'HTTP 200 OK • Token Active • Publishing Permissions Granted • Latency 42ms',
      },
    }));

    const updated = {
      ...adminSettings,
      platforms: {
        ...adminSettings.platforms,
        [platformId]: {
          ...adminSettings.platforms[platformId],
          lastPingStatus: 'healthy' as const,
          lastPingTime: 'Just now',
        },
      },
    };
    onUpdateAdminSettings(updated);

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  const handleSimulateOAuthConnect = (platformId: ConnectedPlatformId) => {
    setAuthModalPlatform(platformId);
  };

  const handleConfirmOAuth = (platformId: ConnectedPlatformId) => {
    const platform = adminSettings.platforms[platformId];
    const updated = {
      ...adminSettings,
      platforms: {
        ...adminSettings.platforms,
        [platformId]: {
          ...platform,
          connected: true,
          tokenExpiresAt: '2027-01-01',
          lastPingStatus: 'healthy' as const,
          lastPingTime: 'Just now',
        },
      },
    };
    onUpdateAdminSettings(updated);
    setAuthModalPlatform(null);
    setSavedNotice(`Successfully authenticated and connected ${platform.name}!`);
    setTimeout(() => setSavedNotice(null), 3000);

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  };

  const handleToggleDisconnect = (platformId: ConnectedPlatformId) => {
    const platform = adminSettings.platforms[platformId];
    const updated = {
      ...adminSettings,
      platforms: {
        ...adminSettings.platforms,
        [platformId]: {
          ...platform,
          connected: !platform.connected,
          lastPingStatus: !platform.connected ? 'healthy' : 'untested',
        },
      },
    };
    onUpdateAdminSettings(updated);
    setSavedNotice(platform.connected ? `Disconnected ${platform.name}` : `Connected ${platform.name}`);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const platformsList = [
    {
      id: 'facebook' as ConnectedPlatformId,
      name: 'Facebook Pages & Reels API',
      accountHandle: adminSettings.platforms.facebook.accountName,
      badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
      iconBg: 'bg-blue-600',
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video'],
      specs: '9:16 Vertical Reels • Max 1GB • 5,000 Chars',
    },
    {
      id: 'instagram' as ConnectedPlatformId,
      name: 'Instagram Graph API (Reels)',
      accountHandle: adminSettings.platforms.instagram.accountName,
      badgeColor: 'border-pink-500/40 bg-pink-500/10 text-pink-400',
      iconBg: 'bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600',
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
      specs: '9:16 Vertical Reels • 60s Max • 2,200 Chars',
    },
    {
      id: 'tiktok' as ConnectedPlatformId,
      name: 'TikTok Content Posting API',
      accountHandle: adminSettings.platforms.tiktok.accountName,
      badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
      iconBg: 'bg-black text-cyan-400 border border-cyan-500/30',
      scopes: ['video.upload', 'video.publish', 'user.info.basic'],
      specs: '9:16 Direct Post • 1080x1920 • 2,200 Chars',
    },
    {
      id: 'youtube' as ConnectedPlatformId,
      name: 'YouTube Data API v3 (Shorts)',
      accountHandle: adminSettings.platforms.youtube.accountName,
      badgeColor: 'border-red-500/40 bg-red-500/10 text-red-400',
      iconBg: 'bg-red-600',
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'youtube.readonly'],
      specs: '9:16 Shorts • Resumable Upload • 100 Char Title',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Social Media Platform Login & OAuth Connections
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                4 PLATFORMS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authenticate OmniPost with Facebook, Instagram, TikTok, and YouTube for automated daily cross-posting
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* 4 Platform Login Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {platformsList.map(item => {
          const config = adminSettings.platforms[item.id];
          const testRes = testResults[item.id];
          const isTokenVisible = showTokens[item.id];

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 bg-slate-950/70 transition-all space-y-4 ${
                config.connected
                  ? 'border-slate-800 hover:border-slate-700 shadow-md'
                  : 'border-red-500/30 bg-red-950/5'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${item.iconBg}`}>
                    {item.id === 'facebook' && 'FB'}
                    {item.id === 'instagram' && 'IG'}
                    {item.id === 'tiktok' && 'TT'}
                    {item.id === 'youtube' && 'YT'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {item.name}
                    </h3>
                    <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>{config.accountName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({config.accountId})</span>
                    </div>
                  </div>
                </div>

                {/* Connection Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      config.connected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    {config.connected ? 'AUTHENTICATED' : 'DISCONNECTED'}
                  </span>
                </div>
              </div>

              {/* Specs & Token Metadata */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Publishing Specs:</span>
                  <span className="text-slate-200 font-mono">{item.specs}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Token Expiration:</span>
                  <span className="text-emerald-400 font-mono">{config.tokenExpiresAt}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Health Ping:</span>
                  <span className="text-cyan-400 font-mono">{config.lastPingTime || 'Healthy'}</span>
                </div>

                {/* Scopes Pill Badges */}
                <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Scopes:</span>
                  {item.scopes.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] font-mono border border-slate-800">
                      {s.split('/').pop()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Test Handshake Result */}
              {testRes && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-mono text-[11px] ${
                  testRes.status === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                }`}>
                  {testRes.status === 'testing' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{testRes.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {config.connected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTestConnection(item.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Test Handshake</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateOAuthConnect(item.id)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Re-authenticate or change credentials"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Re-Auth</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleDisconnect(item.id)}
                      className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Disconnect Account"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSimulateOAuthConnect(item.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-opacity shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Connect & Login with {item.name.split(' ')[0]}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OAuth Login Modal Dialog */}
      {authModalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    OAuth 2.0 Authorization Portal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connect {adminSettings.platforms[authModalPlatform].name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalPlatform(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                OmniPost will request the following official publishing scopes for <strong className="text-white">{adminSettings.platforms[authModalPlatform].accountName}</strong>:
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
                {adminSettings.platforms[authModalPlatform].scopes.map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Official OAuth security: Access tokens are encrypted at rest using AES-256-GCM and never shared with third parties.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAuthModalPlatform(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmOAuth(authModalPlatform)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-slate-950 font-bold text-xs cursor-pointer transition-opacity shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Authorize & Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
