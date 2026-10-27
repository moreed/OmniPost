export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'twitter' | 'facebook';

export interface PlatformDetails {
  id: SocialPlatform;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  maxChars: number;
  recommendedAspect: '9:16' | '1:1' | '16:9';
  tagline: string;
}

export interface PlatformPostContent {
  enabled: boolean;
  title?: string;
  caption: string;
  hashtags: string[];
  firstComment?: string;
  soundName?: string;
  callToAction?: string;
  characterLimit: number;
}

export type VideoTheme = 'cyber-gradient' | 'editorial-luxe' | 'bold-neon' | 'clean-minimal' | 'sunset-retro';

export interface VideoScene {
  id: string;
  phase: 'hook' | 'problem' | 'solution' | 'cta';
  startTime: number; // in seconds
  duration: number;  // in seconds
  primaryText: string;
  secondaryText?: string;
  accentWord?: string;
  badge?: string;
  visualEffect?: 'zoom' | 'slide' | 'fade' | 'pulse';
}

export interface VideoConfig {
  theme: VideoTheme;
  aspectRatio: '9:16' | '1:1' | '16:9';
  scenes: VideoScene[];
  totalDuration: number; // in seconds, typically 15 - 30s
  audioBgm: 'energetic-beat' | 'lofi-chill' | 'tech-synth' | 'corporate-pulse' | 'none';
  voiceoverEnabled: boolean;
  voicePitch: number;
  voiceRate: number;
  subtitlesEnabled: boolean;
  renderedVideoUrl?: string;
}

export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'rendering'
  | 'ready'
  | 'published'
  | 'failed'
  | 'reconciliation_required'
  | 'overdue_held';

/**
 * The 29 raw columns from `Aura432Hz_30_video_master_content_calendar_.xlsx`
 * sheet: `30 Video Posts`
 */
export interface Aura29ColumnRecord {
  videoNumber: number;               // 1. Video #
  date: string;                      // 2. Date (YYYY-MM-DD)
  dayOfWeek: string;                 // 3. Day
  campaignPhase: string;             // 4. Campaign Phase
  contentFocus: string;              // 5. Content Focus
  videoTitle: string;                // 6. Video Title
  videoDuration: number;             // 7. Duration (seconds)
  openingHook: string;               // 8. Opening Hook
  voiceoverScript: string;           // 9. Voiceover Script
  spokenUrlPronunciation: string;    // 10. Spoken URL Pronunciation
  postTimeInstagram: string;         // 11. Instagram Posting Time
  postTimeYouTube: string;           // 12. YouTube Shorts Posting Time
  postTimeFacebook: string;          // 13. Facebook Posting Time
  postTimeTikTok: string;            // 14. TikTok Posting Time
  timeRefEgypt: string;              // 15. Egypt Local Time Reference (Master)
  timeRefUk: string;                 // 16. UK Time Reference
  timeRefUsEastern: string;          // 17. US Eastern Time Reference
  timeRefUsPacific: string;          // 18. US Pacific Time Reference
  masterCaption: string;             // 19. Master Caption (Source of Truth)
  youtubeShortsTitle: string;        // 20. YouTube Shorts Title (max 100 chars)
  callToAction: string;              // 21. Call to Action (CTA)
  hashtags: string;                  // 22. Hashtags
  boostStatus: 'Boost' | 'Organic' | string; // 23. Boost Status
  boostRationale: string;            // 24. Boost Rationale
  geminiPrompt: string;              // 25. Gemini Generation Prompt
  visualGuidelines: string;          // 26. Visual Guidelines
  colorAestheticGuidelines: string;  // 27. Color & Aesthetic Guidelines
  voiceCinematicGuidelines: string;  // 28. Voice & Cinematic Guidelines
  publishingSafetyNotes: string;     // 29. Platform Publishing & Safety Notes
}

export interface SocialPostItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (default master schedule time)
  dayIndex: number; // Video Number 1 to 30
  topic: string;
  category: string;
  coreHook: string;
  fullScript: string;
  status: PostStatus;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  approvalToken?: string;
  contentHash?: string;
  videoConfig: VideoConfig;
  platformContents: Record<SocialPlatform, PlatformPostContent>;
  publishedAt?: string;
  publishLogs: Array<{
    timestamp: string;
    platform: SocialPlatform;
    status: 'success' | 'failure' | 'queued' | 'held';
    message: string;
    externalPostId?: string;
    externalUrl?: string;
    metrics?: { views: number; likes: number; shares: number };
  }>;

  // Exact 29-column mapped metadata for Aura432Hz
  campaignPhase?: string;
  contentFocus?: string;
  videoDuration?: number;
  spokenUrlPronunciation?: string;
  postingTimes?: {
    instagram: string;
    youtube: string;
    facebook: string;
    tiktok: string;
  };
  regionalTimes?: {
    egypt: string;
    uk: string;
    usEastern: string;
    usPacific: string;
  };
  masterCaption?: string;
  youtubeShortsTitle?: string;
  callToAction?: string;
  hashtagsRaw?: string;
  boostStatus?: 'Boost' | 'Organic' | string;
  boostRationale?: string;
  geminiPrompt?: string;
  visualGuidelines?: string;
  colorAestheticGuidelines?: string;
  voiceCinematicGuidelines?: string;
  publishingSafetyNotes?: string;

  // Immutability & audit preservation
  rawSourceRecord: Record<string, any>;
  editedFields: string[];
}

export interface ExcelColumnMapping {
  videoNumberCol: string;
  dateCol: string;
  dayCol: string;
  campaignPhaseCol: string;
  contentFocusCol: string;
  videoTitleCol: string;
  durationCol: string;
  hookCol: string;
  scriptCol: string;
  spokenUrlCol: string;
  postTimeInstagramCol: string;
  postTimeYouTubeCol: string;
  postTimeFacebookCol: string;
  postTimeTikTokCol: string;
  timeRefEgyptCol: string;
  timeRefUkCol: string;
  timeRefUsEasternCol: string;
  timeRefUsPacificCol: string;
  masterCaptionCol: string;
  youtubeShortsTitleCol: string;
  ctaCol: string;
  hashtagsCol: string;
  boostStatusCol: string;
  boostRationaleCol: string;
  geminiPromptCol: string;
  visualGuidelinesCol: string;
  colorGuidelinesCol: string;
  voiceGuidelinesCol: string;
  safetyNotesCol: string;

  // Backward-compatibility aliases
  timeCol?: string;
  topicCol?: string;
  categoryCol?: string;
  instagramCol?: string;
  tiktokCol?: string;
  youtubeCol?: string;
  youtubeTitleCol?: string;
  facebookCol?: string;
  linkedinCol?: string;
  twitterCol?: string;
}

export interface ValidationIssue {
  row: number;
  videoNumber?: number;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ImportValidationReport {
  fileName: string;
  sheetName: string;
  importedAt: string;
  totalRowsDetected: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  columnsMatched: number;
  totalExpectedColumns: number;
  issues: ValidationIssue[];
  status: 'passed' | 'passed_with_warnings' | 'failed';
  readinessScore: number; // 0 to 100
}

export interface Phase1CampaignReadiness {
  all30PackagesLoaded: boolean;
  all29ColumnsMapped: boolean;
  masterTimezoneSet: boolean;
  timeZone: string;
  zeroVideosGenerated: boolean;
  zeroPostsPublished: boolean;
  concurrencyLockEnabled: boolean;
  connectedAccountsTested: boolean;
  overallReady: boolean;
}
