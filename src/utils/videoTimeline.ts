import { VideoConfig, VideoScene, VideoTheme } from '../types/social';

export function generateScenesFromScript(
  hook: string,
  topic: string,
  script: string,
  theme: VideoTheme = 'cyber-gradient',
  aspectRatio: '9:16' | '1:1' | '16:9' = '9:16'
): VideoConfig {
  const cleanHook = hook.trim() || 'Stop Scrolling: The Truth Revealed';
  const cleanTopic = topic.trim() || 'Daily Masterclass';
  
  // Break script into sentences or chunks
  const rawSentences = script
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const problemText = rawSentences[0] || `Most people struggle with ${cleanTopic} because they follow outdated advice.`;
  const solutionText = rawSentences[1] || `The fix is simple: automate your workflow and focus on high-impact hooks.`;
  const ctaText = rawSentences[2] || `Follow for daily breakdowns & get the free template in bio!`;

  const scenes: VideoScene[] = [
    {
      id: 'scene-1',
      phase: 'hook',
      startTime: 0,
      duration: 3.5,
      primaryText: cleanHook,
      secondaryText: `DAY FOCUS: ${cleanTopic.toUpperCase()}`,
      accentWord: cleanHook.split(' ').slice(0, 2).join(' '),
      badge: '🚨 BREAKING INSIGHT',
      visualEffect: 'zoom',
    },
    {
      id: 'scene-2',
      phase: 'problem',
      startTime: 3.5,
      duration: 4.5,
      primaryText: problemText,
      secondaryText: 'THE COMMON TRAP',
      accentWord: 'Mistake',
      badge: '⚠️ THE OBSTACLE',
      visualEffect: 'slide',
    },
    {
      id: 'scene-3',
      phase: 'solution',
      startTime: 8.0,
      duration: 6.0,
      primaryText: solutionText,
      secondaryText: 'THE GAME CHANGER',
      accentWord: 'Strategy',
      badge: '💡 THE SOLUTION',
      visualEffect: 'pulse',
    },
    {
      id: 'scene-4',
      phase: 'cta',
      startTime: 14.0,
      duration: 4.0,
      primaryText: ctaText,
      secondaryText: 'Save & share with your team 🚀',
      accentWord: 'Act Now',
      badge: '📌 TAKE ACTION',
      visualEffect: 'zoom',
    },
  ];

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  return {
    theme,
    aspectRatio,
    scenes,
    totalDuration,
    audioBgm: 'energetic-beat',
    voiceoverEnabled: true,
    voicePitch: 1.0,
    voiceRate: 1.05,
    subtitlesEnabled: true,
  };
}

export const THEME_STYLES: Record<
  VideoTheme,
  {
    name: string;
    bgGradient: string;
    canvasBg: string[];
    accentColor: string;
    textColor: string;
    subtextColor: string;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
  }
> = {
  'cyber-gradient': {
    name: 'Cyberpunk Aurora',
    bgGradient: 'from-violet-950 via-slate-900 to-indigo-950',
    canvasBg: ['#0f0728', '#1a103c', '#090d16'],
    accentColor: '#38bdf8',
    textColor: '#ffffff',
    subtextColor: '#94a3b8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#38bdf8',
    cardBorder: 'rgba(56, 189, 248, 0.3)',
  },
  'editorial-luxe': {
    name: 'Editorial Luxe',
    bgGradient: 'from-stone-950 via-neutral-900 to-amber-950',
    canvasBg: ['#121110', '#1c1917', '#29180c'],
    accentColor: '#f59e0b',
    textColor: '#fef3c7',
    subtextColor: '#d6d3d1',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#fbbf24',
    cardBorder: 'rgba(245, 158, 11, 0.3)',
  },
  'bold-neon': {
    name: 'Electric Acid',
    bgGradient: 'from-zinc-950 via-emerald-950 to-black',
    canvasBg: ['#051b11', '#062817', '#020b06'],
    accentColor: '#10b981',
    textColor: '#ffffff',
    subtextColor: '#a7f3d0',
    badgeBg: 'rgba(16, 185, 129, 0.25)',
    badgeText: '#34d399',
    cardBorder: 'rgba(16, 185, 129, 0.4)',
  },
  'clean-minimal': {
    name: 'Obsidian Minimal',
    bgGradient: 'from-slate-950 via-gray-900 to-zinc-950',
    canvasBg: ['#09090b', '#18181b', '#27272a'],
    accentColor: '#60a5fa',
    textColor: '#f8fafc',
    subtextColor: '#94a3b8',
    badgeBg: 'rgba(96, 165, 250, 0.15)',
    badgeText: '#93c5fd',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
  },
  'sunset-retro': {
    name: 'Sunset Synthwave',
    bgGradient: 'from-rose-950 via-fuchsia-950 to-indigo-950',
    canvasBg: ['#2e081c', '#3b072a', '#1e0c38'],
    accentColor: '#fb7185',
    textColor: '#fff1f2',
    subtextColor: '#fbcfe8',
    badgeBg: 'rgba(251, 113, 133, 0.2)',
    badgeText: '#fda4af',
    cardBorder: 'rgba(251, 113, 133, 0.35)',
  },
};
