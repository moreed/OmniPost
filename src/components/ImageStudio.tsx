import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Smartphone, 
  Square, 
  Monitor, 
  Layers, 
  Sliders, 
  Check, 
  Image as ImageIcon,
  Palette,
  Eye,
  Camera,
  Type,
  Cloud,
  Copy
} from 'lucide-react';
import { SocialPostItem, VideoTheme } from '../types/social';
import { THEME_STYLES } from '../utils/videoTimeline';
import { uploadMediaToR2 } from '../services/cloudflareR2';
import { recordMediaAssetInFirestore } from '../services/firebase';
import confetti from 'canvas-confetti';

interface ImageStudioProps {
  post: SocialPostItem;
  onUpdatePost: (updated: SocialPostItem) => void;
}

export type ImageAspect = '9:16' | '1:1' | '16:9';

export const ImageStudio: React.FC<ImageStudioProps> = ({
  post,
  onUpdatePost,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<ImageAspect>('9:16');
  const [theme, setTheme] = useState<VideoTheme>(post.videoConfig.theme || 'cyber-gradient');
  const [stylePreset, setStylePreset] = useState<'cymatics' | 'fluid' | 'singing_bowl' | 'theta_waves' | 'cosmic'>('cymatics');
  const [showTypography, setShowTypography] = useState<boolean>(true);
  const [headlineText, setHeadlineText] = useState<string>(post.topic || 'Aura 432Hz Sound Healing');
  const [subText, setSubText] = useState<string>(post.coreHook || 'Natural Harmonic Resonance');
  const [promptText, setPromptText] = useState<string>(
    post.geminiPrompt || 'Cinematic 9:16 macro shot of pristine water surface vibrating with cymatic mandala at 432Hz. Celestial golden lighting, deep indigo ambient shadows.'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [attachedSuccess, setAttachedSuccess] = useState<boolean>(false);
  const [randomSeed, setRandomSeed] = useState<number>(() => Math.random() * 1000);
  const [r2Uploading, setR2Uploading] = useState<boolean>(false);
  const [r2UploadedUrl, setR2UploadedUrl] = useState<string | null>(null);

  const themeDetails = THEME_STYLES[theme] || THEME_STYLES['cyber-gradient'];

  // Calculate canvas dimensions based on aspect ratio
  const getCanvasDimensions = useCallback((): { width: number; height: number } => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 450, height: 800 };
      case '1:1':
        return { width: 600, height: 600 };
      case '16:9':
        return { width: 800, height: 450 };
      default:
        return { width: 450, height: 800 };
    }
  }, [aspectRatio]);

  // Render high-fidelity image onto Canvas
  const drawImageCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: w, height: h } = getCanvasDimensions();
    canvas.width = w;
    canvas.height = h;

    // 1. Base Dark Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w * 0.4, h);
    bgGrad.addColorStop(0, themeDetails.bgGradient[0]);
    bgGrad.addColorStop(1, themeDetails.bgGradient[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Ambient Volumetric Glow Orbs
    ctx.save();
    const cx = w / 2;
    const cy = h * 0.45;
    const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.55);
    orbGrad.addColorStop(0, `${themeDetails.accentColor}44`);
    orbGrad.addColorStop(0.5, `${themeDetails.accentColor}18`);
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 3. Procedural Harmonic Visuals based on Preset
    ctx.save();
    if (stylePreset === 'cymatics') {
      // Concentric Sacred Cymatic Rings & Petals
      const rings = 8;
      for (let r = 1; r <= rings; r++) {
        const radius = (r * w) / (rings * 2.2);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${themeDetails.accentColor}${Math.floor(20 + r * 15).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = r % 2 === 0 ? 2 : 1;
        ctx.stroke();

        // Radiating petals
        const petals = 6 + r * 2;
        for (let p = 0; p < petals; p++) {
          const angle = (p * Math.PI * 2) / petals + (randomSeed * 0.01);
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = themeDetails.accentColor;
          ctx.fill();
        }
      }
    } else if (stylePreset === 'fluid') {
      // Fluid Wave Ribbons
      for (let wave = 0; wave < 6; wave++) {
        ctx.beginPath();
        ctx.moveTo(0, cy + (wave - 3) * 35);
        for (let x = 0; x <= w; x += 20) {
          const y = cy + Math.sin(x * 0.015 + wave * 0.8 + randomSeed) * 60 + (wave - 3) * 30;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${themeDetails.accentColor}${Math.floor(30 + wave * 15).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else if (stylePreset === 'singing_bowl') {
      // Tibetan Singing Bowl Resonant Waveforms
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Ripple echoes
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.28 + i * 22, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 - i * 0.07})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (stylePreset === 'theta_waves') {
      // Neural Theta Frequencies
      for (let i = 0; i < 24; i++) {
        const x1 = cx + (Math.sin(i * 0.5 + randomSeed) * w * 0.35);
        const y1 = cy + (Math.cos(i * 0.7 + randomSeed) * h * 0.25);
        const x2 = cx + (Math.sin((i + 1) * 0.5 + randomSeed) * w * 0.35);
        const y2 = cy + (Math.cos((i + 1) * 0.7 + randomSeed) * h * 0.25);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `${themeDetails.accentColor}66`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x1, y1, 4, 0, Math.PI * 2);
        ctx.fillStyle = themeDetails.accentColor;
        ctx.fill();
      }
    } else {
      // Cosmic Nebula Stars
      for (let i = 0; i < 60; i++) {
        const sx = (Math.sin(i * 133 + randomSeed) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 247 + randomSeed) * 0.5 + 0.5) * h;
        const sSize = (Math.sin(i) * 0.5 + 0.5) * 3 + 1;
        ctx.beginPath();
        ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? themeDetails.accentColor : '#ffffff';
        ctx.fill();
      }
    }
    ctx.restore();

    // 4. Subtle Vignette & Film Grain
    ctx.save();
    const vig = ctx.createRadialGradient(cx, cy, w * 0.3, cx, cy, w * 0.75);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 5. Typography Overlay (Clean, No Top Day Line, No Watermark!)
    if (showTypography) {
      ctx.save();
      const contentBoxY = h * 0.65;

      // Card Backing for text readability
      ctx.beginPath();
      ctx.fillStyle = 'rgba(10, 14, 23, 0.75)';
      ctx.strokeStyle = `${themeDetails.accentColor}33`;
      ctx.lineWidth = 1;
      const cardW = w * 0.88;
      const cardH = h * 0.25;
      const cardX = (w - cardW) / 2;
      ctx.roundRect(cardX, contentBoxY, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      // Category Pill
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = themeDetails.accentColor;
      ctx.textAlign = 'center';
      ctx.fillText((post.contentFocus || post.category).toUpperCase(), w / 2, contentBoxY + 30);

      // Headline
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Wrap headline text
      const words = headlineText.split(' ');
      let line1 = '';
      let line2 = '';
      words.forEach((word) => {
        if ((line1 + word).length < 24) {
          line1 += `${word} `;
        } else {
          line2 += `${word} `;
        }
      });

      ctx.fillText(line1.trim(), w / 2, contentBoxY + 62);
      if (line2) {
        ctx.fillText(line2.trim(), w / 2, contentBoxY + 88);
      }

      // Subtext / Hook
      ctx.font = '500 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(subText.slice(0, 48), w / 2, contentBoxY + (line2 ? 116 : 94));

      ctx.restore();
    }
  }, [aspectRatio, theme, stylePreset, showTypography, headlineText, subText, themeDetails, getCanvasDimensions, post, randomSeed]);

  useEffect(() => {
    drawImageCanvas();
  }, [drawImageCanvas]);

  // Download Image as PNG
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Aura432Hz_Day_${post.dayIndex}_${stylePreset}_${aspectRatio.replace(':', 'x')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Attach generated canvas image directly to post package
  const handleAttachAsCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onUpdatePost({
      ...post,
      videoConfig: {
        ...post.videoConfig,
        renderedVideoUrl: dataUrl,
      },
    });

    setAttachedSuccess(true);
    setTimeout(() => setAttachedSuccess(false), 3000);

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  };

  // Upload Cover Image to Cloudflare R2 Object Storage
  const handleUploadToCloudflareR2 = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setR2Uploading(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setR2Uploading(false);
          return;
        }

        const cleanTopic = (post.topic || 'Cover').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);
        const res = await uploadMediaToR2({
          fileBlob: blob,
          fileName: `Aura432_Cover_${post.dayIndex}_${stylePreset}_${cleanTopic}.png`,
          contentType: 'image/png',
          mediaType: 'image',
          postTitle: post.topic,
        });

        setR2UploadedUrl(res.url);
        setR2Uploading(false);

        // Record in Firestore media_assets collection
        await recordMediaAssetInFirestore({
          assetId: `cover_asset_${post.id}_${Date.now()}`,
          title: post.topic,
          mediaType: 'image',
          url: res.url,
          r2Key: res.key,
        });

        // Set as post cover
        onUpdatePost({
          ...post,
          videoConfig: {
            ...post.videoConfig,
            renderedVideoUrl: res.url,
          },
        });

        try {
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }, 'image/png');
    } catch (err) {
      console.error('R2 Image Upload failed:', err);
      setR2Uploading(false);
    }
  };

  // Regenerate variation with new seed
  const handleRegenerate = () => {
    setIsGenerating(true);
    setRandomSeed(Math.random() * 1000);
    setTimeout(() => {
      setIsGenerating(false);
    }, 400);
  };

  const { width: cWidth, height: cHeight } = getCanvasDimensions();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row gap-6">
      {/* Left Canvas Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 min-h-[480px] relative overflow-hidden">
        {/* Canvas Element */}
        <div className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center max-h-[520px]">
          <canvas
            ref={canvasRef}
            className="max-h-[500px] w-auto h-auto object-contain rounded-lg"
          />
        </div>

        {/* Floating Quick Action Overlay */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate Variation</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleUploadToCloudflareR2}
            disabled={r2Uploading}
            className="py-2 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Upload directly to Cloudflare R2 bucket"
          >
            <Cloud className={`w-3.5 h-3.5 text-orange-400 ${r2Uploading ? 'animate-bounce' : ''}`} />
            <span>{r2Uploading ? 'Deploying...' : 'Deploy to R2'}</span>
          </button>

          <button
            type="button"
            onClick={handleAttachAsCover}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-opacity cursor-pointer shadow-md"
          >
            {attachedSuccess ? <Check className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
            <span>{attachedSuccess ? 'Attached as Cover!' : 'Attach as Post Cover'}</span>
          </button>
        </div>

        {/* Public CDN URL Badge */}
        {(r2UploadedUrl || post.videoConfig.renderedVideoUrl?.startsWith('http')) && (
          <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] max-w-md w-full justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-orange-400 font-mono font-bold shrink-0">R2 CDN:</span>
              <span className="text-slate-300 font-mono truncate">
                {r2UploadedUrl || post.videoConfig.renderedVideoUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(r2UploadedUrl || post.videoConfig.renderedVideoUrl || '');
              }}
              className="text-slate-400 hover:text-white p-1"
              title="Copy public CDN URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls & Settings Area */}
      <div className="w-full lg:w-[420px] flex flex-col gap-5">
        {/* Aspect Ratio Selector */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Aspect Ratio & Format</span>
            <span className="text-[10px] text-cyan-400 font-mono">{aspectRatio}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 Vertical</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('1:1')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                aspectRatio === '1:1'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>1:1 Square</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9 Landscape</span>
            </button>
          </div>
        </div>

        {/* Style Presets */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Harmonic Visual Style Preset</span>
            <span className="text-[10px] text-slate-400">Aura432Hz</span>
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'cymatics', label: 'Cymatics Mandala' },
              { id: 'fluid', label: 'Bioluminescent Waves' },
              { id: 'singing_bowl', label: 'Singing Bowl Macro' },
              { id: 'theta_waves', label: 'Neural Theta' },
              { id: 'cosmic', label: 'Cosmic Resonance' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setStylePreset(p.id as any)}
                className={`py-2 px-3 rounded-lg font-medium border text-left truncate transition-all cursor-pointer ${
                  stylePreset === p.id
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Color Grading */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Color Palette & Mood Theme</span>
            <span className="text-[10px] text-slate-400">{theme}</span>
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'cyber-gradient', label: 'Cyber Indigo', color: '#06b6d4' },
              { id: 'editorial-luxe', label: 'Celestial Gold', color: '#f59e0b' },
              { id: 'bold-neon', label: 'Electric Emerald', color: '#10b981' },
              { id: 'clean-minimal', label: 'Clean Platinum', color: '#38bdf8' },
              { id: 'sunset-retro', label: 'Sunset Twilight', color: '#ec4899' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border flex items-center gap-1.5 transition-all cursor-pointer ${
                  theme === t.id
                    ? 'bg-slate-800 text-white border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Typography & Directives */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Overlay Typography</span>
            </label>
            <button
              type="button"
              onClick={() => setShowTypography(!showTypography)}
              className={`text-xs px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors ${
                showTypography ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showTypography ? 'Enabled' : 'Disabled (Art Only)'}
            </button>
          </div>

          {showTypography && (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Headline Text:</span>
                <input
                  type="text"
                  value={headlineText}
                  onChange={e => setHeadlineText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Subtext Hook:</span>
                <input
                  type="text"
                  value={subText}
                  onChange={e => setSubText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 mt-0.5"
                />
              </div>
            </div>
          )}

          {/* Prompt Directive Preview */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Workbook Gemini Prompt:</span>
            </span>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-mono">
              {promptText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
