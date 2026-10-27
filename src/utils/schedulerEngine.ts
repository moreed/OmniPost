import { SocialPostItem, SocialPlatform, PostStatus } from '../types/social';

export interface ScheduleStats {
  total: number;
  published: number;
  scheduled: number;
  ready: number;
  draft: number;
  pendingReview: number;
  approved: number;
  platformCounts: Record<SocialPlatform, number>;
  totalEstimatedReach: number;
}

export function calculateScheduleStats(posts: SocialPostItem[]): ScheduleStats {
  let published = 0;
  let scheduled = 0;
  let ready = 0;
  let draft = 0;
  let pendingReview = 0;
  let approved = 0;
  let totalEstimatedReach = 0;

  const platformCounts: Record<SocialPlatform, number> = {
    tiktok: 0,
    instagram: 0,
    youtube: 0,
    linkedin: 0,
    twitter: 0,
    facebook: 0,
  };

  posts.forEach(post => {
    if (post.status === 'published') published++;
    else if (post.status === 'scheduled') scheduled++;
    else if (post.status === 'ready') ready++;
    else if (post.status === 'pending_review' || post.reviewStatus === 'pending') pendingReview++;
    else if (post.status === 'approved' || post.reviewStatus === 'approved') approved++;
    else draft++;

    // Calculate reach from logs if published, or estimate from day
    post.publishLogs.forEach(log => {
      if (log.metrics) {
        totalEstimatedReach += log.metrics.views || 0;
      }
    });

    // Count enabled platforms
    Object.entries(post.platformContents).forEach(([platformKey, content]) => {
      if (content.enabled) {
        platformCounts[platformKey as SocialPlatform]++;
      }
    });
  });

  if (totalEstimatedReach === 0 && published > 0) {
    totalEstimatedReach = published * 4500;
  }

  return {
    total: posts.length,
    published,
    scheduled,
    ready,
    draft,
    pendingReview,
    approved,
    platformCounts,
    totalEstimatedReach,
  };
}

/**
 * Filter posts by search query, status, and platform
 */
export function filterPosts(
  posts: SocialPostItem[],
  query: string,
  statusFilter: PostStatus | 'all',
  platformFilter: SocialPlatform | 'all'
): SocialPostItem[] {
  const q = query.toLowerCase().trim();

  return posts.filter(post => {
    // Status check
    if (statusFilter !== 'all' && post.status !== statusFilter) {
      return false;
    }

    // Platform check
    if (platformFilter !== 'all') {
      const platformData = post.platformContents[platformFilter];
      if (!platformData || !platformData.enabled) {
        return false;
      }
    }

    // Query search
    if (q) {
      const matchTopic = post.topic.toLowerCase().includes(q);
      const matchHook = post.coreHook.toLowerCase().includes(q);
      const matchCategory = post.category.toLowerCase().includes(q);
      const matchDate = post.date.includes(q);
      if (!matchTopic && !matchHook && !matchCategory && !matchDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Simulates immediate publishing of a post to all enabled platforms
 */
export function executeSimulatedPublish(
  post: SocialPostItem,
  customTimestamp?: string
): SocialPostItem {
  const timeStr = customTimestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const enabledPlatforms = (Object.keys(post.platformContents) as SocialPlatform[]).filter(
    p => post.platformContents[p].enabled
  );

  const newLogs = [...post.publishLogs];

  enabledPlatforms.forEach(platform => {
    const viewRand = Math.floor(1200 + Math.random() * 4500);
    const likeRand = Math.floor(viewRand * (0.08 + Math.random() * 0.05));
    const shareRand = Math.floor(likeRand * (0.15 + Math.random() * 0.1));

    newLogs.unshift({
      timestamp: timeStr,
      platform,
      status: 'success',
      message: `Successfully published to ${platform.toUpperCase()} with video render attachment.`,
      metrics: {
        views: viewRand,
        likes: likeRand,
        shares: shareRand,
      },
    });
  });

  return {
    ...post,
    status: 'published',
    reviewStatus: 'approved',
    publishedAt: `${post.date} ${timeStr}`,
    publishLogs: newLogs,
  };
}

/**
 * Explicit admin approval for video publishing
 */
export function approvePost(
  post: SocialPostItem,
  adminName: string = 'Administrator'
): SocialPostItem {
  return {
    ...post,
    status: 'approved',
    reviewStatus: 'approved',
    approvedBy: adminName,
    approvedAt: new Date().toISOString(),
    rejectionReason: undefined,
  };
}

/**
 * Admin rejects video or requests revisions
 */
export function rejectPost(
  post: SocialPostItem,
  reason: string
): SocialPostItem {
  return {
    ...post,
    status: 'draft',
    reviewStatus: 'rejected',
    rejectionReason: reason,
  };
}

/**
 * Submits video for administrative review
 */
export function submitForReview(post: SocialPostItem): SocialPostItem {
  return {
    ...post,
    status: 'pending_review',
    reviewStatus: 'pending',
  };
}

/**
 * Batch approve multiple posts at once
 */
export function batchApprovePosts(
  posts: SocialPostItem[],
  postIds: string[],
  adminName: string = 'Administrator'
): SocialPostItem[] {
  const now = new Date().toISOString();
  const idSet = new Set(postIds);

  return posts.map(p => {
    if (idSet.has(p.id)) {
      return {
        ...p,
        status: 'approved',
        reviewStatus: 'approved',
        approvedBy: adminName,
        approvedAt: now,
        rejectionReason: undefined,
      };
    }
    return p;
  });
}

