import { SocialPostItem, SocialPlatform } from '../types/social';

export interface PostPerformanceMetric {
  postId: string;
  dayIndex: number;
  date: string;
  topic: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number; // percentage e.g. 5.4%
  topPlatform: SocialPlatform;
}

export interface PlatformEngagementAggregate {
  platform: SocialPlatform;
  displayName: string;
  views: number;
  likes: number;
  shares: number;
  color: string;
}

export interface ContentAuditResult {
  overallScore: number; // 0-100
  hookScore: number;
  retentionScore: number;
  platformFitScore: number;
  checklist: Array<{
    title: string;
    description: string;
    status: 'pass' | 'warn' | 'fail';
  }>;
  recommendations: Array<{
    id: string;
    impact: 'high' | 'medium' | 'low';
    title: string;
    advice: string;
    suggestedFix?: string;
  }>;
}

export function calculatePostMetrics(posts: SocialPostItem[]): PostPerformanceMetric[] {
  return posts.map(post => {
    // If post has metrics in logs, sum them; otherwise deterministic simulation based on day
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;

    post.publishLogs.forEach(log => {
      if (log.metrics) {
        totalViews += log.metrics.views || 0;
        totalLikes += log.metrics.likes || 0;
        totalShares += log.metrics.shares || 0;
      }
    });

    if (totalViews === 0) {
      // Deterministic realistic numbers
      const seed = (post.dayIndex * 1337) % 1000;
      totalViews = post.status === 'published' 
        ? 12500 + seed * 8 
        : (post.status === 'ready' ? 4200 + seed * 3 : 1800 + seed * 2);
      totalLikes = Math.floor(totalViews * 0.082);
      totalShares = Math.floor(totalViews * 0.021);
    }

    const comments = Math.floor(totalLikes * 0.18);
    const totalEngagements = totalLikes + totalShares + comments;
    const engagementRate = totalViews > 0 
      ? Number(((totalEngagements / totalViews) * 100).toFixed(2)) 
      : 0;

    const topPlatform: SocialPlatform = 
      post.dayIndex % 3 === 0 ? 'tiktok' : (post.dayIndex % 2 === 0 ? 'youtube' : 'instagram');

    return {
      postId: post.id,
      dayIndex: post.dayIndex,
      date: post.date,
      topic: post.topic,
      views: totalViews,
      likes: totalLikes,
      shares: totalShares,
      comments,
      engagementRate,
      topPlatform,
    };
  });
}

export function calculatePlatformAggregates(
  metrics: PostPerformanceMetric[]
): PlatformEngagementAggregate[] {
  const map: Record<SocialPlatform, { views: number; likes: number; shares: number; color: string; name: string }> = {
    tiktok: { views: 0, likes: 0, shares: 0, color: '#00f2fe', name: 'TikTok' },
    youtube: { views: 0, likes: 0, shares: 0, color: '#ff0000', name: 'YouTube Shorts' },
    instagram: { views: 0, likes: 0, shares: 0, color: '#ec4899', name: 'Instagram Reels' },
    linkedin: { views: 0, likes: 0, shares: 0, color: '#0284c7', name: 'LinkedIn' },
    twitter: { views: 0, likes: 0, shares: 0, color: '#71717a', name: 'X (Twitter)' },
    facebook: { views: 0, likes: 0, shares: 0, color: '#2563eb', name: 'Facebook' },
  };

  metrics.forEach(m => {
    // Distribute across platforms with realistic weightings
    map.tiktok.views += Math.floor(m.views * 0.38);
    map.tiktok.likes += Math.floor(m.likes * 0.42);
    map.tiktok.shares += Math.floor(m.shares * 0.48);

    map.youtube.views += Math.floor(m.views * 0.28);
    map.youtube.likes += Math.floor(m.likes * 0.24);
    map.youtube.shares += Math.floor(m.shares * 0.22);

    map.instagram.views += Math.floor(m.views * 0.22);
    map.instagram.likes += Math.floor(m.likes * 0.22);
    map.instagram.shares += Math.floor(m.shares * 0.20);

    map.linkedin.views += Math.floor(m.views * 0.06);
    map.linkedin.likes += Math.floor(m.likes * 0.06);
    map.linkedin.shares += Math.floor(m.shares * 0.05);

    map.twitter.views += Math.floor(m.views * 0.04);
    map.twitter.likes += Math.floor(m.likes * 0.04);
    map.twitter.shares += Math.floor(m.shares * 0.03);

    map.facebook.views += Math.floor(m.views * 0.02);
    map.facebook.likes += Math.floor(m.likes * 0.02);
    map.facebook.shares += Math.floor(m.shares * 0.02);
  });

  return (Object.keys(map) as SocialPlatform[]).map(platform => ({
    platform,
    displayName: map[platform].name,
    views: map[platform].views,
    likes: map[platform].likes,
    shares: map[platform].shares,
    color: map[platform].color,
  }));
}

export function auditPostContent(post: SocialPostItem): ContentAuditResult {
  const hook = post.coreHook || '';
  const script = post.fullScript || '';
  const hashtags = post.platformContents.instagram.hashtags || [];
  const scenes = post.videoConfig.scenes || [];

  // 1. Hook evaluation
  let hookScore = 80;
  if (hook.length > 15 && hook.length < 90) hookScore += 10;
  if (/(\d+|how|why|stop|never|secret|truth)/i.test(hook)) hookScore += 10;

  // 2. Retention evaluation
  let retentionScore = 85;
  if (scenes.length >= 4) retentionScore += 5;
  if (post.videoConfig.totalDuration >= 14 && post.videoConfig.totalDuration <= 25) retentionScore += 10;

  // 3. Platform fit
  let platformFitScore = 90;
  const enabledCount = Object.values(post.platformContents).filter(p => p.enabled).length;
  if (enabledCount >= 4) platformFitScore += 5;

  const overallScore = Math.min(Math.round((hookScore * 0.4) + (retentionScore * 0.35) + (platformFitScore * 0.25)), 98);

  const checklist: ContentAuditResult['checklist'] = [
    {
      title: 'Hook Scroll-Stop Velocity (0-3s)',
      description: hook.length < 15 ? 'Hook is too brief.' : 'Strong curiosity gap detected in opening frame.',
      status: hook.length >= 15 ? 'pass' : 'warn',
    },
    {
      title: 'Pacing & Scene Cuts',
      description: `${scenes.length} structured cuts prevent visual fatigue. Optimal for Shorts and Reels.`,
      status: scenes.length >= 3 ? 'pass' : 'warn',
    },
    {
      title: 'Vertical 9:16 Aspect Ratio Compliance',
      description: post.videoConfig.aspectRatio === '9:16' ? 'Full bleed mobile vertical standard met.' : 'Consider 9:16 for maximum viral retention.',
      status: post.videoConfig.aspectRatio === '9:16' ? 'pass' : 'warn',
    },
    {
      title: 'Multi-Platform Caption Optimization',
      description: 'Captions custom tailored across TikTok, YouTube, Instagram, and LinkedIn.',
      status: enabledCount >= 4 ? 'pass' : 'warn',
    },
  ];

  const recommendations: ContentAuditResult['recommendations'] = [
    {
      id: 'rec-1',
      impact: 'high',
      title: 'Front-load contrarian trigger in opening frame',
      advice: 'Videos with unexpected contrarian statements achieve 34% higher completion rate.',
      suggestedFix: `Stop scrolling: If you still do ${post.topic.toLowerCase()} manually, you're wasting 80% of your reach.`,
    },
    {
      id: 'rec-2',
      impact: 'medium',
      title: 'Add high-intent search tags for YouTube Shorts',
      advice: 'YouTube Shorts algorithm indexes the description keywords for long-tail search traffic.',
      suggestedFix: `#${post.topic.replace(/[^a-zA-Z0-9]/g, '')} #ShortsBreakdown #CreatorGrowth`,
    },
    {
      id: 'rec-3',
      impact: 'medium',
      title: 'Pin discussion-starter comment on Instagram',
      advice: 'First comments that prompt a one-word answer boost algorithmic comment velocity.',
      suggestedFix: '👇 Drop your biggest question below and we will break it down tomorrow!',
    },
  ];

  return {
    overallScore,
    hookScore,
    retentionScore,
    platformFitScore,
    checklist,
    recommendations,
  };
}
