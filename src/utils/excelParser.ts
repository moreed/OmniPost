import * as XLSX from 'xlsx';
import {
  SocialPostItem,
  ExcelColumnMapping,
  SocialPlatform,
  ImportValidationReport,
  ValidationIssue,
  Aura29ColumnRecord,
} from '../types/social';
import { generateScenesFromScript } from './videoTimeline';

export interface ParsedExcelResult {
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ExcelColumnMapping;
  validationReport?: ImportValidationReport;
}

export const PLATFORMS_INFO: Record<
  SocialPlatform,
  {
    name: string;
    charLimit: number;
    recommendedAspect: '9:16' | '1:1' | '16:9';
    badgeColor: string;
    description: string;
  }
> = {
  tiktok: {
    name: 'TikTok',
    charLimit: 2200,
    recommendedAspect: '9:16',
    badgeColor: 'bg-black text-white border-cyan-500/50',
    description: 'Direct 9:16 vertical video, trending hooks, punchy sound tags',
  },
  instagram: {
    name: 'Instagram Reels',
    charLimit: 2200,
    recommendedAspect: '9:16',
    badgeColor: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
    description: 'Reels video publishing, save-worthy audio, high visual motion',
  },
  youtube: {
    name: 'YouTube Shorts',
    charLimit: 5000,
    recommendedAspect: '9:16',
    badgeColor: 'bg-red-600 text-white',
    description: 'High CTR titles (<100 chars), SEO keyword tags, 60s max shorts',
  },
  facebook: {
    name: 'Facebook Reels',
    charLimit: 5000,
    recommendedAspect: '9:16',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Community tone, video reel caption, discussion share prompt',
  },
  linkedin: {
    name: 'LinkedIn',
    charLimit: 3000,
    recommendedAspect: '1:1',
    badgeColor: 'bg-sky-700 text-white',
    description: 'Executive takeaways, professional value, discussion questions',
  },
  twitter: {
    name: 'X (Twitter)',
    charLimit: 280,
    recommendedAspect: '16:9',
    badgeColor: 'bg-zinc-800 text-white border-zinc-700',
    description: 'Ultra-concise hook, high shareability, thread starter',
  },
};

export const AURA_29_HEADERS = [
  'Video #',
  'Date',
  'Day',
  'Campaign Phase',
  'Content Focus',
  'Video Title',
  'Duration',
  'Opening Hook',
  'Voiceover Script',
  'Spoken URL Pronunciation',
  'Instagram Posting Time',
  'YouTube Shorts Posting Time',
  'Facebook Posting Time',
  'TikTok Posting Time',
  'Egypt Local Time Reference',
  'UK Time Reference',
  'US Eastern Time Reference',
  'US Pacific Time Reference',
  'Master Caption',
  'YouTube Shorts Title',
  'Call to Action (CTA)',
  'Hashtags',
  'Boost Status',
  'Boost Rationale',
  'Gemini Generation Prompt',
  'Visual Guidelines',
  'Color & Aesthetic Guidelines',
  'Voice & Cinematic Guidelines',
  'Platform Publishing & Safety Notes',
];

/**
 * Intelligent fuzzy matcher for 29 spreadsheet headers
 */
export function autoDetectColumnMapping(headers: string[]): ExcelColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const h of headers) {
      const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const cand of candidates) {
        const normCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized === normCand || normalized.includes(normCand)) {
          return h;
        }
      }
    }
    return '';
  };

  return {
    videoNumberCol: findMatch(['video#', 'videonumber', 'videono', 'daynumber', 'day#', 'id']),
    dateCol: findMatch(['date', 'publishdate', 'scheduledate', 'postdate']),
    dayCol: findMatch(['day', 'dayofweek', 'weekday']),
    campaignPhaseCol: findMatch(['campaignphase', 'phase', 'stage', 'campaign']),
    contentFocusCol: findMatch(['contentfocus', 'focus', 'pillar', 'category', 'theme']),
    videoTitleCol: findMatch(['videotitle', 'title', 'headline', 'topic']),
    durationCol: findMatch(['duration', 'length', 'videoduration', 'runtime']),
    hookCol: findMatch(['openinghook', 'hook', 'first3sec', 'hookline']),
    scriptCol: findMatch(['voiceoverscript', 'script', 'narration', 'content', 'storyboard']),
    spokenUrlCol: findMatch(['spokenurlpronunciation', 'spokenurl', 'urlpronunciation', 'websiteurl']),
    postTimeInstagramCol: findMatch(['instagrampostingtime', 'igtime', 'instagramtime', 'igslot']),
    postTimeYouTubeCol: findMatch(['youtubeshortspostingtime', 'yttime', 'youtubetime', 'shortstime']),
    postTimeFacebookCol: findMatch(['facebookpostingtime', 'fbtime', 'facebooktime', 'fbslot']),
    postTimeTikTokCol: findMatch(['tiktokpostingtime', 'tttime', 'tiktoktime', 'toktime']),
    timeRefEgyptCol: findMatch(['egyptlocaltimereference', 'egypttime', 'cairotime', 'mastertime', 'cairo']),
    timeRefUkCol: findMatch(['uktimereference', 'uktime', 'londontime', 'gmt']),
    timeRefUsEasternCol: findMatch(['useasterntimereference', 'useasterntime', 'newyorktime', 'est', 'edt']),
    timeRefUsPacificCol: findMatch(['uspacifictimereference', 'uspacifictime', 'losangelestime', 'pst', 'pdt']),
    masterCaptionCol: findMatch(['mastercaption', 'caption', 'maincaption', 'sourcecaption']),
    youtubeShortsTitleCol: findMatch(['youtubeshortstitle', 'yttitle', 'shortstitle', 'shorttitle']),
    ctaCol: findMatch(['calltoactioncta', 'calltoaction', 'cta', 'action']),
    hashtagsCol: findMatch(['hashtags', 'tags', 'keywords']),
    boostStatusCol: findMatch(['booststatus', 'boost', 'promotestatus', 'paidstatus']),
    boostRationaleCol: findMatch(['boostrationale', 'rationale', 'boostreason', 'targetaudience']),
    geminiPromptCol: findMatch(['geminigenerationprompt', 'geminiprompt', 'aiprompt', 'videoprompt']),
    visualGuidelinesCol: findMatch(['visualguidelines', 'visuals', 'framing', 'cinematography']),
    colorGuidelinesCol: findMatch(['coloraestheticguidelines', 'colorguidelines', 'colorpalette', 'aesthetic']),
    voiceGuidelinesCol: findMatch(['voicecinematicguidelines', 'voiceguidelines', 'audioprofile', 'tone']),
    safetyNotesCol: findMatch(['platformpublishingsafetynotes', 'safetynotes', 'compliancenotes', 'copyrightnotes']),

    // Legacy aliases for backward compatibility
    timeCol: findMatch(['time', 'publishtime', 'scheduletime', 'timeslot', 'slot']),
    topicCol: findMatch(['topic', 'theme', 'title', 'headline', 'concept', 'subject']),
    categoryCol: findMatch(['category', 'pillar', 'bucket', 'campaign', 'tag', 'contentfocus']),
    instagramCol: findMatch(['instagram', 'ig', 'igcaption', 'reels', 'reelscontent']),
    tiktokCol: findMatch(['tiktok', 'tt', 'ttcaption', 'tokcaption', 'tiktokpost']),
    youtubeCol: findMatch(['youtubedescription', 'ytshorts', 'yt', 'youtube', 'shortdescription']),
    youtubeTitleCol: findMatch(['youtubetitle', 'yttitle', 'shorttitle', 'videotitle']),
    facebookCol: findMatch(['facebook', 'fb', 'fbpost', 'fbreels']),
    linkedinCol: findMatch(['linkedin', 'li', 'lipost']),
    twitterCol: findMatch(['twitter', 'x', 'tweet']),
  };
}

/**
 * Validates the imported workbook and generates a strict Phase 1 readiness report
 */
export function validate29ColumnWorkbook(
  rawRows: Record<string, any>[],
  fileName: string,
  sheetName: string,
  headers: string[]
): ImportValidationReport {
  const issues: ValidationIssue[] = [];
  const mapping = autoDetectColumnMapping(headers);

  // Check matching headers count
  const mappedCols = Object.values(mapping).filter(v => v !== '');
  const columnsMatched = mappedCols.length;
  const totalExpectedColumns = 29;

  if (columnsMatched < 15) {
    issues.push({
      row: 0,
      field: 'headers',
      severity: 'error',
      message: `Only ${columnsMatched} of 29 expected columns recognized. Ensure headers match the 30 Video Posts format.`,
    });
  }

  // Verify row count
  if (rawRows.length !== 30) {
    issues.push({
      row: 0,
      field: 'rowCount',
      severity: rawRows.length > 0 ? 'warning' : 'error',
      message: `Expected 30 daily video packages, detected ${rawRows.length} rows.`,
    });
  }

  const seenVideoNumbers = new Set<number>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const rawNum = row[mapping.videoNumberCol];
    const num = parseInt(String(rawNum || rowNum), 10);

    if (isNaN(num)) {
      issues.push({
        row: rowNum,
        field: 'Video #',
        severity: 'warning',
        message: `Row ${rowNum}: Non-numeric Video # '${rawNum}'. Auto-assigning Day ${rowNum}.`,
      });
    } else {
      if (seenVideoNumbers.has(num)) {
        issues.push({
          row: rowNum,
          videoNumber: num,
          field: 'Video #',
          severity: 'error',
          message: `Row ${rowNum}: Duplicate Video #${num} detected! Each of the 30 days must be unique.`,
        });
      }
      seenVideoNumbers.add(num);
    }

    // Check mandatory content fields
    const title = row[mapping.videoTitleCol];
    if (!title || String(title).trim() === '') {
      issues.push({
        row: rowNum,
        videoNumber: num,
        field: 'Video Title',
        severity: 'error',
        message: `Row ${rowNum}: Missing Video Title.`,
      });
    }

    const hook = row[mapping.hookCol];
    if (!hook || String(hook).trim() === '') {
      issues.push({
        row: rowNum,
        videoNumber: num,
        field: 'Opening Hook',
        severity: 'warning',
        message: `Row ${rowNum}: Missing Opening Hook (0-3s).`,
      });
    }

    const script = row[mapping.scriptCol];
    if (!script || String(script).trim() === '') {
      issues.push({
        row: rowNum,
        videoNumber: num,
        field: 'Voiceover Script',
        severity: 'error',
        message: `Row ${rowNum}: Missing Voiceover Script for narration.`,
      });
    }

    const masterCaption = row[mapping.masterCaptionCol];
    if (!masterCaption || String(masterCaption).trim() === '') {
      issues.push({
        row: rowNum,
        videoNumber: num,
        field: 'Master Caption',
        severity: 'warning',
        message: `Row ${rowNum}: Missing Master Caption.`,
      });
    }

    // Check YouTube Shorts Title character limit
    const ytTitle = row[mapping.youtubeShortsTitleCol];
    if (ytTitle && String(ytTitle).length > 100) {
      issues.push({
        row: rowNum,
        videoNumber: num,
        field: 'YouTube Shorts Title',
        severity: 'warning',
        message: `Row ${rowNum}: YouTube Shorts title exceeds 100 characters (${String(ytTitle).length} chars).`,
      });
    }
  });

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  let status: 'passed' | 'passed_with_warnings' | 'failed' = 'passed';
  if (errorCount > 0) {
    status = 'failed';
  } else if (warningCount > 0) {
    status = 'passed_with_warnings';
  }

  // Calculate readiness score
  let score = 100;
  score -= errorCount * 15;
  score -= warningCount * 3;
  if (columnsMatched < 29) {
    score -= (29 - columnsMatched) * 2;
  }
  const readinessScore = Math.max(0, Math.min(100, score));

  return {
    fileName,
    sheetName,
    importedAt: new Date().toISOString(),
    totalRowsDetected: rawRows.length,
    validRows: Math.max(0, rawRows.length - errorCount),
    errorCount,
    warningCount,
    columnsMatched,
    totalExpectedColumns,
    issues,
    status,
    readinessScore,
  };
}

/**
 * Parses an Excel or CSV file buffer/arrayBuffer into structured data with validation report
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheetNames = workbook.SheetNames;
  // Look for target sheet "30 Video Posts" first, or fallback to first sheet
  const activeSheet = sheetNames.find(s => s.toLowerCase().includes('30 video posts')) || sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[activeSheet];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(key => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  const detectedMapping = autoDetectColumnMapping(headers);
  const validationReport = validate29ColumnWorkbook(rawRows, file.name, activeSheet, headers);

  return {
    sheetNames,
    activeSheet,
    headers,
    rawRows,
    detectedMapping,
    validationReport,
  };
}

/**
 * Parses raw text pasted directly from spreadsheet (TSV/CSV)
 */
export function parsePastedSpreadsheetText(rawText: string): ParsedExcelResult {
  const workbook = XLSX.read(rawText, { type: 'string' });
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetNames[0] || 'PastedData';
  const worksheet = workbook.Sheets[activeSheet];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(key => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  const detectedMapping = autoDetectColumnMapping(headers);
  const validationReport = validate29ColumnWorkbook(rawRows, 'Pasted_Spreadsheet_Data', activeSheet, headers);

  return {
    sheetNames,
    activeSheet,
    headers,
    rawRows,
    detectedMapping,
    validationReport,
  };
}

/**
 * Formats a raw date value into standard YYYY-MM-DD starting Nov 1
 */
export function normalizeDate(rawDate: any, fallbackIndex: number): string {
  if (!rawDate) {
    const day = Math.min(fallbackIndex + 1, 30);
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return `2026-11-${dayStr}`;
  }

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate.toISOString().split('T')[0];
  }

  const str = String(rawDate).trim();

  // Test if it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle explicit "Day X" strings e.g. "Day 1", "Day 15"
  const dayPrefixMatch = str.match(/^(?:day\s*)(\d{1,2})$/i);
  if (dayPrefixMatch) {
    const d = parseInt(dayPrefixMatch[1], 10);
    const padded = d < 10 ? `0${d}` : `${d}`;
    return `2026-11-${padded}`;
  }

  if (str.toLowerCase().includes('nov') || str.includes('/') || str.includes('-')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      return parsed.toISOString().split('T')[0];
    }
  }

  const dayMatch = str.match(/\b([1-9]|[12]\d|3[01])\b/);
  if (dayMatch) {
    const d = parseInt(dayMatch[1], 10);
    const padded = d < 10 ? `0${d}` : `${d}`;
    return `2026-11-${padded}`;
  }

  const fallbackDay = Math.min(fallbackIndex + 1, 30);
  return `2026-11-${fallbackDay < 10 ? '0' + fallbackDay : fallbackDay}`;
}

export function extractHashtags(rawText: string): string[] {
  if (!rawText) return ['#432Hz', '#SoundHealing', '#BinauralBeats', '#Aura432Hz'];
  const matches = rawText.match(/#[A-Za-z0-9_]+/g);
  if (matches && matches.length > 0) {
    return Array.from(new Set(matches));
  }
  return rawText
    .split(/[,;\s]+/)
    .map(w => w.trim().replace(/^#*/, '#'))
    .filter(w => w.length > 2);
}

/**
 * Converts parsed raw spreadsheet rows into SocialPostItems while preserving
 * untouched rawSourceRecord and mapping all 29 fields
 */
export function convertRowsToSocialPosts(
  rawRows: Record<string, any>[],
  mapping: ExcelColumnMapping
): SocialPostItem[] {
  return rawRows.map((row, index) => {
    const dayNum = parseInt(String(row[mapping.videoNumberCol] || index + 1), 10) || (index + 1);
    const rowDate = normalizeDate(row[mapping.dateCol], dayNum - 1);
    const dayOfWeek = (row[mapping.dayCol] || 'Sunday').toString().trim();
    const campaignPhase = (row[mapping.campaignPhaseCol] || 'Phase 1: Harmonic Awakening').toString().trim();
    const contentFocus = (row[mapping.contentFocusCol] || 'Sound Healing Science').toString().trim();
    const topic = (row[mapping.videoTitleCol] || `Day ${dayNum}: Aura 432Hz Sound Journey`).toString().trim();
    const duration = parseInt(String(row[mapping.durationCol] || 30), 10) || 30;
    const hook = (row[mapping.hookCol] || `Day ${dayNum} of our 30-day sound journey. Notice what your mind does in 10s of 432Hz.`).toString().trim();
    const script = (row[mapping.scriptCol] || `When you align your acoustic environment with 432Hz natural resonance, neurological stress drops.`).toString().trim();
    const spokenUrl = (row[mapping.spokenUrlCol] || 'Aura four thirty-two hertz dot com').toString().trim();

    // 4 platform posting times
    const postTimeIg = (row[mapping.postTimeInstagramCol] || '18:00').toString().trim();
    const postTimeYt = (row[mapping.postTimeYouTubeCol] || '19:30').toString().trim();
    const postTimeFb = (row[mapping.postTimeFacebookCol] || '20:00').toString().trim();
    const postTimeTt = (row[mapping.postTimeTikTokCol] || '21:00').toString().trim();

    // 4 regional time references
    const timeEgypt = (row[mapping.timeRefEgyptCol] || '20:00 Cairo (UTC+2)').toString().trim();
    const timeUk = (row[mapping.timeRefUkCol] || '18:00 London (GMT)').toString().trim();
    const timeUsEast = (row[mapping.timeRefUsEasternCol] || '13:00 New York (EST)').toString().trim();
    const timeUsPac = (row[mapping.timeRefUsPacificCol] || '10:00 Los Angeles (PST)').toString().trim();

    // Copy & distribution
    const masterCaption = (row[mapping.masterCaptionCol] || `${topic}. Listen with headphones for peak harmonic resonance.`).toString().trim();
    const ytShortsTitle = (row[mapping.youtubeShortsTitleCol] || `${topic} in 30 Seconds #Shorts`).toString().trim().slice(0, 100);
    const cta = (row[mapping.ctaCol] || 'Tap link in bio to stream full session.').toString().trim();
    const rawHashtags = (row[mapping.hashtagsCol] || '#432Hz #SoundHealing #BinauralBeats #Aura432Hz').toString().trim();
    const baseHashtags = extractHashtags(rawHashtags);

    const boostStatus = (row[mapping.boostStatusCol] || (dayNum % 4 === 0 ? 'Boost' : 'Organic')).toString().trim();
    const boostRationale = (row[mapping.boostRationaleCol] || 'Targeted wellness audience segment').toString().trim();

    // Generative directives
    const geminiPrompt = (row[mapping.geminiPromptCol] || `Cinematic 9:16 macro shot of pristine water surface vibrating with cymatics at 432Hz. Celestial golden lighting, deep indigo background, 4k fluid motion.`).toString().trim();
    const visualGuidelines = (row[mapping.visualGuidelinesCol] || 'Vertical 9:16 framing. High contrast kinetic typography. Sacred geometry mandala motion.').toString().trim();
    const colorGuidelines = (row[mapping.colorGuidelinesCol] || 'Obsidian black (#0A0E17), celestial gold (#F59E0B), deep frequency cyan (#06B6D4).').toString().trim();
    const voiceGuidelines = (row[mapping.voiceGuidelinesCol] || 'Warm, resonant baritone narration. Moderate cadence with subtle 432Hz background drone.').toString().trim();
    const safetyNotes = (row[mapping.safetyNotesCol] || 'Original audio composition. 100% rights cleared across all platforms.').toString().trim();

    const videoConfig = generateScenesFromScript(hook, topic, script);

    const postItem: SocialPostItem = {
      id: `aura-pkg-day-${dayNum.toString().padStart(2, '0')}`,
      date: rowDate,
      time: postTimeIg,
      dayIndex: dayNum,
      topic,
      category: contentFocus,
      coreHook: hook,
      fullScript: script,
      status: 'draft',
      reviewStatus: 'pending',
      videoConfig,
      platformContents: {
        instagram: {
          enabled: true,
          caption: `${masterCaption}\n\n${cta}\n\n${rawHashtags}`,
          hashtags: baseHashtags,
          characterLimit: 2200,
        },
        tiktok: {
          enabled: true,
          caption: `${hook} 🎧 Follow for daily 432Hz sound baths #432Hz #soundhealing #aura432hz #fyp`,
          hashtags: ['#432Hz', '#soundhealing', '#aura432hz', '#fyp'],
          characterLimit: 2200,
        },
        youtube: {
          enabled: true,
          title: ytShortsTitle,
          caption: `${topic}\n\n${script}\n\n🔗 ${spokenUrl}\n\n${rawHashtags}`,
          hashtags: ['#Shorts', '#432Hz', '#SoundHealing'],
          characterLimit: 5000,
        },
        facebook: {
          enabled: true,
          caption: `Day ${dayNum} of our 30-Day Frequency Series: ${topic}.\n\n${masterCaption}\n\n${cta}`,
          hashtags: ['#SoundHealing', '#432Hz', '#Wellness'],
          characterLimit: 5000,
        },
        linkedin: {
          enabled: false,
          caption: '',
          hashtags: [],
          characterLimit: 3000,
        },
        twitter: {
          enabled: false,
          caption: '',
          hashtags: [],
          characterLimit: 280,
        },
      },
      publishLogs: [],

      // Complete 29-column mapped metadata
      campaignPhase,
      contentFocus,
      videoDuration: duration,
      spokenUrlPronunciation: spokenUrl,
      postingTimes: {
        instagram: postTimeIg,
        youtube: postTimeYt,
        facebook: postTimeFb,
        tiktok: postTimeTt,
      },
      regionalTimes: {
        egypt: timeEgypt,
        uk: timeUk,
        usEastern: timeUsEast,
        usPacific: timeUsPac,
      },
      masterCaption,
      youtubeShortsTitle: ytShortsTitle,
      callToAction: cta,
      hashtagsRaw: rawHashtags,
      boostStatus,
      boostRationale,
      geminiPrompt,
      visualGuidelines,
      colorAestheticGuidelines: colorGuidelines,
      voiceCinematicGuidelines: voiceGuidelines,
      publishingSafetyNotes: safetyNotes,

      // Untouched pristine source record
      rawSourceRecord: { ...row },
      editedFields: [],
      contentHash: `hash-day-${dayNum}-${topic.length}`,
    };

    return postItem;
  });
}

/**
 * Creates and downloads the official 29-column Excel workbook matching
 * `Aura432Hz_30_video_master_content_calendar_.xlsx`
 */
export function exportAura29ColumnWorkbook(
  posts: SocialPostItem[],
  variant: 'populated' | 'blank',
  filename = 'Aura432Hz_30_video_master_content_calendar_.xlsx'
) {
  const sheetData = posts.map(p => {
    if (variant === 'blank') {
      const isExample = p.dayIndex === 1;
      return {
        'Video #': p.dayIndex,
        'Date': p.date,
        'Day': p.rawSourceRecord?.dayOfWeek || 'Sunday',
        'Campaign Phase': isExample ? 'Phase 1: Harmonic Awakening' : '',
        'Content Focus': isExample ? 'Harmonic Science' : '',
        'Video Title': isExample ? 'Why Standard Music Is Causing Unconscious Anxiety' : '',
        'Duration': 30,
        'Opening Hook': isExample ? 'Did you know 99% of songs you listen to are tuned to an unnatural frequency?' : '',
        'Voiceover Script': isExample ? 'In 1939, international concert pitch was standardized to 440 Hertz. Ancient instruments vibrated at 432 Hertz...' : '',
        'Spoken URL Pronunciation': isExample ? 'Visit Aura four thirty-two hertz dot com to stream free.' : '',
        'Instagram Posting Time': '18:00',
        'YouTube Shorts Posting Time': '19:30',
        'Facebook Posting Time': '20:00',
        'TikTok Posting Time': '21:00',
        'Egypt Local Time Reference': '20:00 Cairo (UTC+2)',
        'UK Time Reference': '18:00 London (GMT)',
        'US Eastern Time Reference': '13:00 New York (EST)',
        'US Pacific Time Reference': '10:00 Los Angeles (PST)',
        'Master Caption': isExample ? 'Ever wondered why certain music leaves you on edge? The difference is in 432Hz harmonic geometry.' : '',
        'YouTube Shorts Title': isExample ? 'Why 432Hz Music Instantly Calms Your Brain in 60s #Shorts' : '',
        'Call to Action (CTA)': isExample ? 'Tap link in bio to experience pure 432Hz acoustic sessions.' : '',
        'Hashtags': isExample ? '#432Hz #SoundHealing #FrequencyHealing #Aura432Hz' : '',
        'Boost Status': isExample ? 'Boost' : 'Organic',
        'Boost Rationale': isExample ? 'Flagship campaign introduction' : '',
        'Gemini Generation Prompt': isExample ? 'Cinematic 9:16 macro shot of pristine water surface vibrating with cymatic mandala at 432Hz.' : '',
        'Visual Guidelines': isExample ? 'Vertical 9:16 framing. Center cymatic sacred geometry.' : '',
        'Color & Aesthetic Guidelines': isExample ? 'Obsidian black (#0A0E17), luminous celestial gold (#F59E0B), cyan (#06B6D4).' : '',
        'Voice & Cinematic Guidelines': isExample ? 'Warm, reassuring baritone narrator. Moderate cadence.' : '',
        'Platform Publishing & Safety Notes': isExample ? 'Original sound composition. Zero copyright claims.' : '',
      };
    }

    return {
      'Video #': p.dayIndex,
      'Date': p.date,
      'Day': p.rawSourceRecord?.dayOfWeek || 'Sunday',
      'Campaign Phase': p.campaignPhase || 'Phase 1: Harmonic Awakening',
      'Content Focus': p.contentFocus || p.category,
      'Video Title': p.topic,
      'Duration': p.videoDuration || 30,
      'Opening Hook': p.coreHook,
      'Voiceover Script': p.fullScript,
      'Spoken URL Pronunciation': p.spokenUrlPronunciation || 'Aura four thirty-two hertz dot com',
      'Instagram Posting Time': p.postingTimes?.instagram || '18:00',
      'YouTube Shorts Posting Time': p.postingTimes?.youtube || '19:30',
      'Facebook Posting Time': p.postingTimes?.facebook || '20:00',
      'TikTok Posting Time': p.postingTimes?.tiktok || '21:00',
      'Egypt Local Time Reference': p.regionalTimes?.egypt || '20:00 Cairo (UTC+2)',
      'UK Time Reference': p.regionalTimes?.uk || '18:00 London (GMT)',
      'US Eastern Time Reference': p.regionalTimes?.usEastern || '13:00 New York (EST)',
      'US Pacific Time Reference': p.regionalTimes?.usPacific || '10:00 Los Angeles (PST)',
      'Master Caption': p.masterCaption || p.platformContents.instagram.caption,
      'YouTube Shorts Title': p.youtubeShortsTitle || p.platformContents.youtube.title || `${p.topic} #Shorts`,
      'Call to Action (CTA)': p.callToAction || 'Tap link in bio to stream full track',
      'Hashtags': p.hashtagsRaw || (p.platformContents.instagram.hashtags || []).join(' '),
      'Boost Status': p.boostStatus || 'Organic',
      'Boost Rationale': p.boostRationale || 'Standard organic pillar content',
      'Gemini Generation Prompt': p.geminiPrompt || '',
      'Visual Guidelines': p.visualGuidelines || '',
      'Color & Aesthetic Guidelines': p.colorAestheticGuidelines || '',
      'Voice & Cinematic Guidelines': p.voiceCinematicGuidelines || '',
      'Platform Publishing & Safety Notes': p.publishingSafetyNotes || 'Original cleared audio composition.',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData);

  // Set column widths matching the 29 columns
  worksheet['!cols'] = [
    { wch: 10 }, // Video #
    { wch: 12 }, // Date
    { wch: 12 }, // Day
    { wch: 30 }, // Campaign Phase
    { wch: 28 }, // Content Focus
    { wch: 40 }, // Video Title
    { wch: 10 }, // Duration
    { wch: 55 }, // Opening Hook
    { wch: 70 }, // Voiceover Script
    { wch: 35 }, // Spoken URL Pronunciation
    { wch: 20 }, // Instagram Posting Time
    { wch: 24 }, // YouTube Shorts Posting Time
    { wch: 20 }, // Facebook Posting Time
    { wch: 18 }, // TikTok Posting Time
    { wch: 26 }, // Egypt Local Time Reference
    { wch: 22 }, // UK Time Reference
    { wch: 26 }, // US Eastern Time Reference
    { wch: 26 }, // US Pacific Time Reference
    { wch: 60 }, // Master Caption
    { wch: 45 }, // YouTube Shorts Title
    { wch: 35 }, // Call to Action (CTA)
    { wch: 45 }, // Hashtags
    { wch: 14 }, // Boost Status
    { wch: 40 }, // Boost Rationale
    { wch: 70 }, // Gemini Generation Prompt
    { wch: 50 }, // Visual Guidelines
    { wch: 50 }, // Color & Aesthetic Guidelines
    { wch: 50 }, // Voice & Cinematic Guidelines
    { wch: 50 }, // Platform Publishing & Safety Notes
  ];

  // Sheet 2: Specifications & Safety Rules
  const specsData = [
    {
      'Platform': 'Facebook Reels',
      'Aspect Ratio': '9:16 Vertical',
      'Max File Size': '1 GB',
      'Optimal Duration': '15 - 60s',
      'Character Limit': '5,000 chars',
      'Required OAuth Permissions': 'pages_show_list, pages_manage_posts, pages_read_engagement',
    },
    {
      'Platform': 'Instagram Reels',
      'Aspect Ratio': '9:16 Vertical',
      'Max File Size': '1 GB',
      'Optimal Duration': '15 - 60s',
      'Character Limit': '2,200 chars',
      'Required OAuth Permissions': 'instagram_basic, instagram_content_publish',
    },
    {
      'Platform': 'TikTok',
      'Aspect Ratio': '9:16 Vertical',
      'Max File Size': '500 MB',
      'Optimal Duration': '15 - 34s',
      'Character Limit': '2,200 chars',
      'Required OAuth Permissions': 'video.upload, video.publish (Requires App Audit)',
    },
    {
      'Platform': 'YouTube Shorts',
      'Aspect Ratio': '9:16 Vertical',
      'Max File Size': '256 GB',
      'Optimal Duration': '15 - 60s',
      'Character Limit': 'Title: 100 / Desc: 5,000',
      'Required OAuth Permissions': 'https://www.googleapis.com/auth/youtube.upload (1,600 units/upload)',
    },
  ];

  const specsSheet = XLSX.utils.json_to_sheet(specsData);
  specsSheet['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 65 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '30 Video Posts');
  XLSX.utils.book_append_sheet(workbook, specsSheet, 'Platform Specifications & Rules');

  XLSX.writeFile(workbook, filename);
}

/**
 * Legacy compatibility wrapper for exportPostsToExcel
 */
/**
 * Generates 30 structured days with core 4 platforms enabled for blank production frameworks
 */
export function generateBlankTemplatePosts(): SocialPostItem[] {
  const result: SocialPostItem[] = [];

  for (let i = 1; i <= 30; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    const date = `2026-11-${dayStr}`;
    const isExample = i === 1;

    const topic = isExample ? 'Kickoff: Why 432Hz Sound Healing Dominates' : `Day ${i}: Custom Topic Headline`;
    const hook = isExample 
      ? 'If you still listen to standard 440Hz, you are creating unconscious tension.' 
      : 'Enter your 0-3s video opening hook statement here...';
    const script = isExample
      ? 'Every day this November, our cross-posting system generates vertical video timelines and synchronizes posts across Facebook Reels, Instagram Reels, TikTok, and YouTube Shorts.'
      : 'Draft your full 3-scene video narration script here.';

    const videoConfig = generateScenesFromScript(hook, topic, script, 'cyber-gradient', '9:16');

    result.push({
      id: `blank-post-nov-${dayStr}`,
      dayIndex: i,
      date,
      time: '18:00',
      topic,
      category: isExample ? 'Harmonic Science' : 'General Content',
      coreHook: hook,
      fullScript: script,
      videoConfig,
      status: 'draft',
      reviewStatus: 'pending',
      platformContents: {
        facebook: {
          enabled: true,
          caption: isExample
            ? '🔥 Day 1 of our 30-Day Video Blueprint! Watch how cross-posting to Facebook, TikTok, and YouTube keeps your community engaged every single day.'
            : 'Enter Facebook Reel caption and community question here...',
          hashtags: ['#FacebookReels', '#VideoMarketing'],
          characterLimit: 5000,
        },
        instagram: {
          enabled: true,
          caption: isExample
            ? '🚀 30 Days of daily short-form videos starting Nov 1!\n\nSave this reel for your content batching days.\n\nDrop "WORKFLOW" below for the free calendar template! 📲'
            : 'Enter Instagram Reels caption, CTA, and keyword tags here...',
          hashtags: ['#InstagramReels', '#ContentStrategy', '#ViralReels'],
          characterLimit: 2200,
        },
        tiktok: {
          enabled: true,
          caption: isExample
            ? 'Stop uploading manually to 4 apps. Automate your cross-posting workflow now ⚡ #tiktokgrowth #contenttips #fyp'
            : 'Enter TikTok punchy caption, sound keyword, and hashtags here... #fyp',
          hashtags: ['#tiktokgrowth', '#fyp', '#contentcreator'],
          characterLimit: 2200,
        },
        youtube: {
          enabled: true,
          title: isExample
            ? 'How Cross-Platform Video Automation Scales Audience Reach'
            : `Day ${i}: YouTube Shorts Catchy Title (Under 100 Chars)`,
          caption: isExample
            ? 'Discover how automated syndication across Facebook, TikTok, Instagram, and YouTube Shorts scales reach effortlessly.\n\nSubscribe for 30 daily November shorts!'
            : 'Full YouTube Shorts video description and SEO chapter timestamps...',
          hashtags: ['#Shorts', '#Automation', '#YouTubeShorts'],
          characterLimit: 5000,
        },
        linkedin: {
          enabled: false,
          caption: '',
          hashtags: ['#Innovation', '#Leadership'],
          characterLimit: 3000,
        },
        twitter: {
          enabled: false,
          caption: '',
          hashtags: ['#SocialMedia'],
          characterLimit: 280,
        },
      },
      publishLogs: [],
      rawSourceRecord: {
        'Video #': i,
        'Date': date,
        'Day': 'Sunday',
        'Video Title': topic,
      },
      editedFields: [],
    });
  }

  return result;
}

export function exportPostsToExcel(posts: SocialPostItem[], filename = 'Aura432Hz_30_video_master_content_calendar_.xlsx') {
  exportAura29ColumnWorkbook(posts, 'populated', filename);
}

export function exportTemplateToExcel(variant: 'nov_30_day' | 'blank', customPosts?: SocialPostItem[]) {
  if (variant === 'blank') {
    exportAura29ColumnWorkbook(customPosts || [], 'blank', 'Aura432Hz_Blank_Template_29_Columns.xlsx');
  } else {
    exportAura29ColumnWorkbook(customPosts || [], 'populated', 'Aura432Hz_30_video_master_content_calendar_.xlsx');
  }
}
