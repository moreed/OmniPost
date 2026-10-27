import { AdminSettings, ConnectedPlatformId, PlatformConnectionConfig } from '../types/admin';

const STORAGE_KEY = 'omnipost_admin_settings_v1';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  isAuthenticated: false,
  adminUsername: 'Administrator',
  lastLoginTime: '',
  autoRefreshTokens: true,
  webhookUrl: 'https://api.omnipost.studio/v1/webhooks/daily-dispatch',
  webhookSecret: 'whsec_9847120938471902834710293',
  maxDailyUploads: 50,
  retryOnFailure: true,
  maxRetries: 3,
  productionTimeZone: 'Africa/Cairo',
  maxDailyGenerations: 1,
  dailyBudgetCapDollars: 5.0,
  requireExplicitApproval: true,
  platforms: {
    facebook: {
      id: 'facebook',
      name: 'Facebook Pages & Reels API',
      connected: true,
      accountName: 'Aura432Hz Official Page',
      accountId: 'fb_page_8921049281',
      accessToken: 'EAAGNO4...fb_live_token_verified',
      appId: '109283746192837',
      tokenExpiresAt: '2026-12-31',
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video'],
      lastPingStatus: 'healthy',
      lastPingTime: 'Just now',
      quotaUsage: {
        used: 14,
        limit: 200,
        unit: 'calls/hr',
      },
    },
    instagram: {
      id: 'instagram',
      name: 'Instagram Graph API (Reels)',
      connected: true,
      accountName: '@aura432hz (Professional)',
      accountId: 'ig_biz_9018239012',
      accessToken: 'IGQVJ...instagram_graph_token',
      appId: '109283746192837',
      tokenExpiresAt: '2026-12-31',
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
      lastPingStatus: 'healthy',
      lastPingTime: 'Just now',
      quotaUsage: {
        used: 8,
        limit: 100,
        unit: 'reels/day',
      },
    },
    tiktok: {
      id: 'tiktok',
      name: 'TikTok Content Posting API',
      connected: true,
      accountName: '@aura432hz.frequencies',
      accountId: 'tt_creator_48102938',
      accessToken: 'act.d89f24...tiktok_oauth_token',
      appId: 'tt_app_client_key_99',
      tokenExpiresAt: '2026-11-28',
      scopes: ['video.upload', 'video.publish', 'user.info.basic'],
      lastPingStatus: 'healthy',
      lastPingTime: '2 mins ago',
      quotaUsage: {
        used: 6,
        limit: 25,
        unit: 'videos/day',
      },
    },
    youtube: {
      id: 'youtube',
      name: 'YouTube Data API v3 (Shorts)',
      connected: true,
      accountName: 'Aura432Hz Sound Journey',
      accountId: 'UC_aura432hz_prod_channel',
      accessToken: 'ya29.a0...google_youtube_token',
      refreshToken: '1//0g...refresh_token_offline',
      appId: '891029384712-cloud.apps.googleusercontent.com',
      tokenExpiresAt: '2027-01-15',
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
      lastPingStatus: 'healthy',
      lastPingTime: 'Just now',
      quotaUsage: {
        used: 1600,
        limit: 10000,
        unit: 'units/day',
      },
    },
  },
};

export function loadAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function saveAdminSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
