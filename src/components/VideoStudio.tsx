import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Sparkles, Volume2, VolumeX, Monitor, Smartphone, Square, Check, Layers, Cloud, Copy } from 'lucide-react';
import { SocialPostItem, VideoTheme } from '../types/social';
import { THEME_STYLES } from '../utils/videoTimeline';
import { audioEngine } from '../utils/audioSynth';
import { uploadMediaToR2 } from '../services/cloudflareR2';
import { recordMediaAssetInFirestore } from '../services/firebase';
import confetti from 'canvas-confetti';

interface VideoStudioProps {
  post: SocialPostItem;
  onUpdatePost: (updated: SocialPostItem) => void;
  onBatchRenderAll?: () => void;
  isBatchRendering?: boolean;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  post,
  onUpdatePost,
  onBatchRenderAll,
  isBatchRendering = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceoverActive, setVoiceoverActive] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [r2Uploading, setR2Uploading] = useState<boolean>(false);
  const [r2UploadedUrl, setR2UploadedUrl] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const videoConfig = post.videoConfig;
  const currentTheme = videoConfig.theme || 'cyber-gradient';
  const themeDetails = THEME_STYLES[currentTheme] || THEME_STYLES['cyber-gradient'];
  const totalDuration = videoConfig.totalDuration || 18;

  // Determine current scene from currentTime
  const currentScene = videoConfig.scenes.find(
    s => currentTime >= s.startTime && currentTime < s.startTime + s.duration
  ) || videoConfig.scenes[videoConfig.scenes.length - 1];

  // Canvas dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    switch (videoConfig.aspectRatio) {
      case '9:16':
        return { width: 450, height: 800 };
      case '1:1':
        return { width: 600, height: 600 };
      case '16:9':
        return { width: 800, height: 450 };
      default:
        return { width: 450, height: 800 };
    }
  };

  const { width: canvasW, height: canvasH } = getCanvasDimensions();

  // Draw scene onto canvas
  const drawFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Background Gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, themeDetails.canvasBg[0]);
      grad.addColorStop(0.5, themeDetails.canvasBg[1]);
      grad.addColorStop(1, themeDetails.canvasBg[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Animated Floating Particle Grid / Glow Orbs
      ctx.save();
      ctx.beginPath();
      const pulse = Math.sin(time * 3) * 0.5 + 0.5;
      const orbGrad = ctx.createRadialGradient(
        w * 0.5 + Math.cos(time * 0.8) * 80,
        h * 0.35 + Math.sin(time * 1.2) * 60,
        20,
        w * 0.5,
        h * 0.35,
        w * 0.65
      );
      orbGrad.addColorStop(0, `${themeDetails.accentColor}33`);
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // 3. Top bar removed per user instructions

      // 4. Current Phase Badge
      if (currentScene) {
        ctx.save();
        ctx.beginPath();
        const badgeText = currentScene.badge || `PHASE: ${currentScene.phase.toUpperCase()}`;
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const badgeW = textWidth + 24;
        const badgeH = 28;
        const badgeX = (w - badgeW) / 2;
        const badgeY = h * 0.14;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = themeDetails.accentColor;
        ctx.lineWidth = 1.5;
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = themeDetails.accentColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, w / 2, badgeY + badgeH / 2);
        ctx.restore();
      }

      // 5. Kinetic Typography Text
      if (currentScene) {
        ctx.save();
        const sceneLocalTime = time - currentScene.startTime;
        const sceneProgress = Math.min(sceneLocalTime / currentScene.duration, 1);
        
        // Dynamic bouncy entrance
        const scale = 0.95 + Math.min(sceneProgress * 0.08, 0.08) + Math.sin(time * 4) * 0.015;

        ctx.translate(w / 2, h * 0.44);
        ctx.scale(scale, scale);

        // Word wrapping for primary text
        const words = currentScene.primaryText.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        const maxLineWidth = w * 0.78;

        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxLineWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);

        // Render lines with kinetic drop shadow
        const lineHeight = 36;
        const startY = -(lines.length * lineHeight) / 2;

        lines.forEach((line, idx) => {
          const y = startY + idx * lineHeight;
          
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.textAlign = 'center';
          ctx.fillText(line, 2, y + 2);

          // Highlight accent word if present
          if (currentScene.accentWord && line.toLowerCase().includes(currentScene.accentWord.toLowerCase())) {
            ctx.fillStyle = themeDetails.accentColor;
          } else {
            ctx.fillStyle = themeDetails.textColor;
          }
          ctx.fillText(line, 0, y);
        });

        ctx.restore();

        // Secondary / Subtitle context box
        if (currentScene.secondaryText) {
          ctx.save();
          ctx.font = '600 14px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = themeDetails.subtextColor;
          ctx.textAlign = 'center';
          ctx.fillText(currentScene.secondaryText, w / 2, h * 0.68);
          ctx.restore();
        }
      }

      // 6. Dynamic Audio Waveform Simulation at Bottom
      ctx.save();
      const waveY = h * 0.78;
      const barCount = 28;
      const barWidth = 6;
      const gap = (w * 0.7) / barCount;
      const startX = w * 0.15;

      ctx.fillStyle = themeDetails.accentColor;
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.abs(Math.sin(time * 6 + i * 0.4)) * 28 + (pulse * 12) + 4;
        const x = startX + i * gap;
        ctx.beginPath();
        ctx.roundRect(x, waveY - barHeight / 2, barWidth, barHeight, 3);
        ctx.fill();
      }
      ctx.restore();

      // 7. Watermark branding removed per user instructions

      // 8. Bottom Progress Bar
      ctx.save();
      const progressPercent = Math.min(time / totalDuration, 1);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, h - 6, w, 6);

      ctx.fillStyle = themeDetails.accentColor;
      ctx.fillRect(0, h - 6, w * progressPercent, 6);
      ctx.restore();
    },
    [currentScene, currentTheme, post, themeDetails, totalDuration]
  );

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stopBeat();
      return;
    }

    if (!isMuted) {
      audioEngine.startBeat();
    }

    lastTimeRef.current = performance.now();

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stopBeat();
    };
  }, [isPlaying, isMuted, totalDuration]);

  // Redraw when currentTime changes
  useEffect(() => {
    drawFrame(currentTime);
  }, [currentTime, drawFrame]);

  // Trigger speech synthesis for narration when scene changes
  useEffect(() => {
    if (!voiceoverActive || !isPlaying || !currentScene) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentScene.primaryText);
      utterance.rate = videoConfig.voiceRate || 1.1;
      utterance.pitch = videoConfig.voicePitch || 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentScene?.id, voiceoverActive, isPlaying]);

  // Handle Play / Pause
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const handleAspectRatioChange = (aspectRatio: '9:16' | '1:1' | '16:9') => {
    onUpdatePost({
      ...post,
      videoConfig: {
        ...post.videoConfig,
        aspectRatio,
      },
    });
  };

  const handleThemeChange = (theme: VideoTheme) => {
    onUpdatePost({
      ...post,
      videoConfig: {
        ...post.videoConfig,
        theme,
      },
    });
  };

  // Export Canvas as Video (WebM/MP4)
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    setExportProgress(0);
    setIsPlaying(false);
    setCurrentTime(0);

    const stream = canvas.captureStream(30);
    recordedChunksRef.current = [];

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
    } catch {
      mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsExporting(false);
      setExportProgress(100);

      // Auto update post status to 'ready'
      onUpdatePost({
        ...post,
        status: post.status === 'draft' ? 'ready' : post.status,
        videoConfig: {
          ...post.videoConfig,
          renderedVideoUrl: url,
        },
      });
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    // Render step-by-step
    const fps = 30;
    const totalFrames = Math.floor(totalDuration * fps);
    let frame = 0;

    const exportInterval = setInterval(() => {
      frame++;
      const time = frame / fps;
      setCurrentTime(time);
      drawFrame(time);
      setExportProgress(Math.round((frame / totalFrames) * 100));

      if (frame >= totalFrames) {
        clearInterval(exportInterval);
        mediaRecorder.stop();
      }
    }, 1000 / fps);
  };

  // Upload Video frame or recorded asset to Cloudflare R2 Edge Object Storage
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

        const cleanTopic = (post.topic || 'Video_Post').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);
        const res = await uploadMediaToR2({
          fileBlob: blob,
          fileName: `Aura432_Day_${post.dayIndex}_${cleanTopic}.png`,
          contentType: 'image/png',
          mediaType: 'image',
          postTitle: post.topic,
        });

        setR2UploadedUrl(res.url);
        setR2Uploading(false);

        // Record in Firestore for persistent audit
        await recordMediaAssetInFirestore({
          assetId: `video_poster_${post.id}_${Date.now()}`,
          title: post.topic,
          mediaType: 'image',
          url: res.url,
          r2Key: res.key,
        });

        // Update post media reference
        onUpdatePost({
          ...post,
          status: post.status === 'draft' ? 'ready' : post.status,
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
      console.error('R2 Video Upload failed:', err);
      setR2Uploading(false);
    }
  };

  // AI Script Polish
  const handlePolishWithAI = async () => {
    setAiGenerating(true);
    try {
      // Simulate or call AI model enhancement
      await new Promise(r => setTimeout(r, 600));
      const enhancedHook = `🔥 Why 90% Fail at ${post.topic} (And the 10-Second Fix)`;
      const enhancedScript = `Here is the unspoken rule of ${post.topic}: Simplify your message, cut the fluff, and lead with tangible proof. Implement this starting Nov 1.`;
      
      onUpdatePost({
        ...post,
        coreHook: enhancedHook,
        fullScript: enhancedScript,
      });
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Nov {post.dayIndex} Video Asset
            </span>
            <span className="text-xs text-slate-400">Total Duration: {totalDuration}s</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">{post.topic}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePolishWithAI}
            disabled={aiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all cursor-pointer"
            title="Polish script & hook with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            {aiGenerating ? 'Polishing...' : 'AI Polish Hook'}
          </button>

          {onBatchRenderAll && (
            <button
              type="button"
              onClick={onBatchRenderAll}
              disabled={isBatchRendering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              {isBatchRendering ? 'Rendering 30 Days...' : 'Batch Render Nov 1-30'}
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Display Viewport */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 max-h-[520px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasW}
              height={canvasH}
              className="max-h-[500px] w-auto object-contain rounded"
              style={{
                aspectRatio:
                  videoConfig.aspectRatio === '9:16'
                    ? '9/16'
                    : videoConfig.aspectRatio === '1:1'
                    ? '1/1'
                    : '16/9',
              }}
            />

            {/* Overlay Play trigger on click */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play video preview"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/80 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer backdrop-blur-sm"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            )}
          </div>

          {/* Player Timeline Bar & Controls */}
          <div className="w-full mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-cyan-400 w-10">
                {currentTime.toFixed(1)}s
              </span>
              <input
                type="range"
                min={0}
                max={totalDuration}
                step={0.1}
                value={currentTime}
                onChange={e => setCurrentTime(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                aria-label="Video timeline scrubber"
              />
              <span className="text-xs font-mono text-slate-500 w-10 text-right">
                {totalDuration}s
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  aria-label="Restart playback"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  aria-label={isMuted ? 'Unmute BGM beat' : 'Mute BGM beat'}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceoverActive(v => !v)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    voiceoverActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Voiceover: {voiceoverActive ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleAspectRatioChange('9:16')}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    videoConfig.aspectRatio === '9:16'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="9:16 Vertical (TikTok, Reels, Shorts)"
                >
                  <Smartphone className="w-3.5 h-3.5" /> 9:16
                </button>
                <button
                  type="button"
                  onClick={() => handleAspectRatioChange('1:1')}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    videoConfig.aspectRatio === '1:1'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="1:1 Square (Feed, LinkedIn)"
                >
                  <Square className="w-3.5 h-3.5" /> 1:1
                </button>
                <button
                  type="button"
                  onClick={() => handleAspectRatioChange('16:9')}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    videoConfig.aspectRatio === '16:9'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="16:9 Widescreen (YouTube long, FB)"
                >
                  <Monitor className="w-3.5 h-3.5" /> 16:9
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Customization & Export Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Theme Selector */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Motion Style & Palette
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEME_STYLES) as VideoTheme[]).map(key => {
                const style = THEME_STYLES[key];
                const isSelected = currentTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleThemeChange(key)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: style.accentColor }}
                      />
                      <span>{style.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scene Breakdown */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Scene Storyboard ({videoConfig.scenes.length} Cuts)
              </h3>
              <span className="text-[11px] text-cyan-400 font-mono">
                Active: {currentScene?.phase.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {videoConfig.scenes.map((scene, idx) => {
                const isCurrent =
                  currentTime >= scene.startTime &&
                  currentTime < scene.startTime + scene.duration;
                return (
                  <div
                    key={scene.id}
                    onClick={() => setCurrentTime(scene.startTime)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-cyan-500/60 bg-cyan-500/10 text-white'
                        : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-1">
                      <span className="text-cyan-400 font-bold uppercase">
                        #{idx + 1} {scene.phase}
                      </span>
                      <span>
                        {scene.startTime}s - {(scene.startTime + scene.duration).toFixed(1)}s
                      </span>
                    </div>
                    <p className="line-clamp-2 text-slate-200">{scene.primaryText}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Video Actions */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Render & Export Video
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ready for auto-posting to Reels, Shorts, TikTok
                </p>
              </div>
              {post.status === 'ready' && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Rendered Ready
                </span>
              )}
            </div>

            {isExporting ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Rendering canvas frames...</span>
                  <span className="font-mono">{exportProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-100"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportVideo}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Render Video for Nov {post.dayIndex}
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadToCloudflareR2}
                    disabled={r2Uploading}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                    title="Upload rendered asset directly to Cloudflare R2 edge storage"
                  >
                    <Cloud className={`w-4 h-4 ${r2Uploading ? 'animate-bounce' : ''}`} />
                    <span>{r2Uploading ? 'Deploying...' : 'Deploy to R2'}</span>
                  </button>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={`OmniPost_Day_${post.dayIndex}_Nov.webm`}
                      className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center justify-center"
                      title="Download recorded WebM file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {(r2UploadedUrl || post.videoConfig.renderedVideoUrl?.startsWith('http')) && (
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="text-orange-400 font-mono font-bold">R2 CDN:</span>
                      <span className="text-slate-300 font-mono truncate max-w-[220px]">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
