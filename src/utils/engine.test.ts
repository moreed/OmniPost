import test from 'node:test';
import assert from 'node:assert/strict';
import { autoDetectColumnMapping, normalizeDate, extractHashtags, generateBlankTemplatePosts } from './excelParser';
import { generateScenesFromScript } from './videoTimeline';
import { calculateScheduleStats, filterPosts } from './schedulerEngine';
import { generateDefaultNovemberCalendar } from './defaultCalendar';
import { calculatePostMetrics, calculatePlatformAggregates, auditPostContent } from './performanceEngine';

test('autoDetectColumnMapping accurately matches varied column names', () => {
  const headers = ['Publish Date', 'Time Slot', 'Theme & Topic', 'Opening Hook', 'Video Script', 'IG Caption', 'TikTok Post', 'YouTube Title', 'Tags'];
  const mapping = autoDetectColumnMapping(headers);

  assert.equal(mapping.dateCol, 'Publish Date');
  assert.equal(mapping.timeCol, 'Time Slot');
  assert.equal(mapping.topicCol, 'Theme & Topic');
  assert.equal(mapping.hookCol, 'Opening Hook');
  assert.equal(mapping.scriptCol, 'Video Script');
  assert.equal(mapping.instagramCol, 'IG Caption');
  assert.equal(mapping.tiktokCol, 'TikTok Post');
  assert.equal(mapping.youtubeTitleCol, 'YouTube Title');
  assert.equal(mapping.hashtagsCol, 'Tags');
});

test('normalizeDate formats varied dates to standard YYYY-MM-DD starting Nov 1', () => {
  assert.equal(normalizeDate('2026-11-01', 0), '2026-11-01');
  assert.equal(normalizeDate('Day 1', 0), '2026-11-01');
  assert.equal(normalizeDate('Day 15', 14), '2026-11-15');
  assert.equal(normalizeDate('', 0), '2026-11-01');
});

test('extractHashtags extracts hashtags properly and falls back gracefully', () => {
  const extracted = extractHashtags('#Tech #Growth #Viral');
  assert.deepEqual(extracted, ['#Tech', '#Growth', '#Viral']);

  const extractedWords = extractHashtags('marketing, viral, reels');
  assert.deepEqual(extractedWords, ['#marketing', '#viral', '#reels']);
});

test('generateScenesFromScript decomposes text into 4 video scenes with timings', () => {
  const config = generateScenesFromScript(
    'Never do this in 2026',
    'AI Marketing',
    'Stop wasting hours on manual edits. Automation is the key. Subscribe today.'
  );

  assert.equal(config.scenes.length, 4);
  assert.equal(config.scenes[0].phase, 'hook');
  assert.equal(config.scenes[0].primaryText, 'Never do this in 2026');
  assert.equal(config.scenes[3].phase, 'cta');
  assert(config.totalDuration >= 15);
});

test('generateDefaultNovemberCalendar starts at Nov 1 and generates 30 full days', () => {
  const calendar = generateDefaultNovemberCalendar();
  assert.equal(calendar.length, 30);
  assert.equal(calendar[0].date, '2026-11-01');
  assert.equal(calendar[0].dayIndex, 1);
  assert.equal(calendar[29].date, '2026-11-30');
  assert.equal(calendar[29].dayIndex, 30);
  assert(calendar[0].platformContents.tiktok.enabled);
  assert(calendar[0].platformContents.instagram.enabled);
  assert(calendar[0].platformContents.youtube.enabled);
});

test('calculateScheduleStats computes accurate summaries for 4 core platforms', () => {
  const calendar = generateDefaultNovemberCalendar();
  const stats = calculateScheduleStats(calendar);

  assert.equal(stats.total, 30);
  assert(stats.platformCounts.tiktok > 0);
  assert(stats.platformCounts.youtube > 0);
  assert(stats.platformCounts.facebook > 0);
  assert(stats.platformCounts.instagram > 0);
});

test('filterPosts filters correctly by query, status, and platform', () => {
  const calendar = generateDefaultNovemberCalendar();
  const filtered = filterPosts(calendar, '432Hz', 'all', 'all');
  assert(filtered.length >= 1);
  assert(
    filtered[0].topic.toLowerCase().includes('432hz') || 
    filtered[0].coreHook.toLowerCase().includes('432hz') ||
    filtered[0].category.toLowerCase().includes('432hz')
  );

  const publishedOnly = filterPosts(calendar, '', 'published', 'all');
  assert.equal(publishedOnly.length, 0); // initial is strictly Phase 1 draft
});

test('calculatePostMetrics and calculatePlatformAggregates generate valid metrics', () => {
  const calendar = generateDefaultNovemberCalendar();
  const metrics = calculatePostMetrics(calendar);

  assert.equal(metrics.length, 30);
  assert(metrics[0].views > 0);
  assert(metrics[0].likes > 0);
  assert(metrics[0].engagementRate > 0);

  const aggregates = calculatePlatformAggregates(metrics);
  assert.equal(aggregates.length, 6);
  assert(aggregates.find((a: any) => a.platform === 'tiktok')!.views > 0);

  const audit = auditPostContent(calendar[0]);
  assert(audit.overallScore >= 70 && audit.overallScore <= 100);
  assert(audit.recommendations.length > 0);
  assert(audit.checklist.length > 0);
});

test('generateBlankTemplatePosts generates 30 structured days with core 4 platforms enabled', () => {
  const blankPosts = generateBlankTemplatePosts();
  assert.equal(blankPosts.length, 30);
  assert.equal(blankPosts[0].date, '2026-11-01');
  assert.equal(blankPosts[0].dayIndex, 1);
  assert.equal(blankPosts[29].date, '2026-11-30');
  assert.equal(blankPosts[29].dayIndex, 30);

  // Core 4 platforms enabled by default
  const day1 = blankPosts[0];
  assert.equal(day1.platformContents.facebook.enabled, true);
  assert.equal(day1.platformContents.instagram.enabled, true);
  assert.equal(day1.platformContents.tiktok.enabled, true);
  assert.equal(day1.platformContents.youtube.enabled, true);

  // Character limits conform to platform specs
  assert.equal(day1.platformContents.facebook.characterLimit, 5000);
  assert.equal(day1.platformContents.instagram.characterLimit, 2200);
  assert.equal(day1.platformContents.tiktok.characterLimit, 2200);
  assert.equal(day1.platformContents.youtube.characterLimit, 5000);
});

test('validate29ColumnWorkbook validates headers, duplicate detection, and readiness score', async () => {
  const { validate29ColumnWorkbook, AURA_29_HEADERS } = await import('./excelParser');
  const mockRows = Array.from({ length: 30 }, (_, i) => ({
    'Video #': i + 1,
    'Date': `2026-11-${(i + 1).toString().padStart(2, '0')}`,
    'Day': 'Sunday',
    'Campaign Phase': 'Phase 1',
    'Content Focus': 'Sound Science',
    'Video Title': `Day ${i + 1} Sound Healing`,
    'Duration': 30,
    'Opening Hook': 'Listen closely...',
    'Voiceover Script': 'When 432Hz plays, tension dissolves.',
    'Master Caption': 'Harmonic resonance in action.',
    'YouTube Shorts Title': `Day ${i + 1} #Shorts`,
    'Instagram Posting Time': '18:00',
    'YouTube Shorts Posting Time': '19:30',
    'Facebook Posting Time': '20:00',
    'TikTok Posting Time': '21:00',
    'Egypt Local Time Reference': '20:00 Cairo',
  }));

  const report = validate29ColumnWorkbook(mockRows, 'Aura432Hz_30_video_master_content_calendar_.xlsx', '30 Video Posts', AURA_29_HEADERS);
  assert.equal(report.totalRowsDetected, 30);
  assert.equal(report.validRows, 30);
  assert.equal(report.errorCount, 0);
  assert(report.readinessScore >= 90);
});

