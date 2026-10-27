export type ConnectedPlatformId = 'facebook' | 'instagram' | 'tiktok' | 'youtube';

export interface PlatformConnectionConfig {
  id: ConnectedPlatformId;
  name: string;
  connected: boolean;
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  appId?: string;
  appSecret?: string;
  webhookSecret?: string;
  tokenExpiresAt: string;
  scopes: string[];
  lastPingStatus: 'healthy' | 'warning' | 'error' | 'untested';
  lastPingTime?: string;
  quotaUsage: {
    used: number;
    limit: number;
    unit: string;
  };
}

export interface AdminSettings {
  isAuthenticated: boolean;
  adminUsername: string;
  lastLoginTime: string;
  autoRefreshTokens: boolean;
  webhookUrl: string;
  webhookSecret: string;
  maxDailyUploads: number;
  retryOnFailure: boolean;
  maxRetries: number;
  productionTimeZone: string;
  maxDailyGenerations: number;
  dailyBudgetCapDollars: number;
  requireExplicitApproval: boolean;
  platforms: Record<ConnectedPlatformId, PlatformConnectionConfig>;
}
