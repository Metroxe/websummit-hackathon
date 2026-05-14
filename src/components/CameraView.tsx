import { useEffect, useRef } from 'react';
import { createDetector, type Detection, type Detector } from '../lib/detector';
import { createTracker, type TrackedPerson, type Tracker } from '../lib/tracker';
import {
  createCategorizer,
  CATEGORY_COLORS,
  type Category,
  type Categorizer,
} from '../lib/categorizer';
import type { CategoryCounts } from './Hud';
import './CameraView.css';

export type FrameSnapshot = {
  counts: CategoryCounts;
  categories: Map<number, Category>;
  timestamp: number;
};

type CameraViewProps = {
  onError: (message: string) => void;
  onFrame: (snap: FrameSnapshot) => void;
};

type FlashState = Map<number, { until: number; color: string }>;

const FLASH_DURATION_MS = 700;

export function CameraView({ onError, onFrame }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let stream: MediaStream | null = null;
    let rafId = 0;
    let cancelled = false;
    let detector: Detector | null = null;
    let tracker: Tracker | null = null;
    let categorizer: Categorizer | null = null;

    const lastCategoryById = new Map<number, Category>();
    const flashes: FlashState = new Map();

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        detector = await createDetector();
        tracker = createTracker();
        categorizer = createCategorizer();

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onError('Could not get 2D canvas context.');
          return;
        }

        onFrame({
          counts: { walkedBy: 0, engaged: 0 },
          categories: new Map(),
          timestamp: performance.now(),
        });

        const loop = async () => {
          if (cancelled) return;

          let tracked: TrackedPerson[] = [];
          let categories = new Map<number, Category>();
          const now = performance.now();
          try {
            const detections: Detection[] = (await detector?.detect(video, now)) ?? [];
            tracked = tracker?.update(detections, now) ?? [];

            const result = categorizer?.update(tracked, now);
            if (result) {
              categories = result.categories;
              // Trigger a flash for any tracked person whose category upgraded.
              for (const [id, cat] of categories) {
                const prev = lastCategoryById.get(id);
                if (prev !== cat) {
                  flashes.set(id, {
                    until: now + FLASH_DURATION_MS,
                    color: CATEGORY_COLORS[cat],
                  });
                  lastCategoryById.set(id, cat);
                }
              }
              onFrame({
                counts: result.counts,
                categories,
                timestamp: now,
              });
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('detection frame failed', err);
          }

          drawOverlay(ctx, canvas, tracked, categories, flashes, now);
          rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start camera.';
        onError(message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      detector?.dispose();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (video) {
        video.srcObject = null;
      }
    };
  }, [onError, onFrame]);

  return (
    <div className="camera-view">
      <video ref={videoRef} className="camera-view__video" playsInline muted />
      <canvas ref={canvasRef} className="camera-view__canvas" />
      <div className="camera-view__vignette" aria-hidden />
      <div className="camera-view__viewfinder" aria-hidden>
        <span className="vf vf--tl" />
        <span className="vf vf--tr" />
        <span className="vf vf--bl" />
        <span className="vf vf--br" />
      </div>
    </div>
  );
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tracked: TrackedPerson[],
  categories: Map<number, Category>,
  flashes: FlashState,
  now: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const { id, box } of tracked) {
    const category = categories.get(id) ?? 'walked-by';
    const color = CATEGORY_COLORS[category];

    const flash = flashes.get(id);
    let flashAlpha = 0;
    if (flash) {
      const remaining = flash.until - now;
      if (remaining > 0) {
        flashAlpha = remaining / FLASH_DURATION_MS;
      } else {
        flashes.delete(id);
      }
    }

    drawBracketBox(ctx, box, color, flashAlpha, now);
    drawLabel(ctx, box, id, category, color);
  }
}

function drawBracketBox(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  color: string,
  flashAlpha: number,
  now: number,
) {
  const { x, y, width, height } = box;
  const bracket = Math.max(22, Math.min(width, height) * 0.28);
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Bright full-rect outline — the primary "detected" affordance.
  ctx.save();
  ctx.globalAlpha = 0.75 + flashAlpha * 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();

  // Inner color wash so the body of the box reads as "locked on".
  ctx.save();
  ctx.globalAlpha = 0.14 + flashAlpha * 0.18;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.restore();

  // Animated scanning beam sweeping vertically — the "we're analysing" cue.
  const scanT = ((now / 1800) % 1);
  const scanY = y + scanT * height;
  const beamHalf = 28;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  const gradient = ctx.createLinearGradient(x, scanY - beamHalf, x, scanY + beamHalf);
  gradient.addColorStop(0, withAlpha(color, 0));
  gradient.addColorStop(0.5, withAlpha(color, 0.85));
  gradient.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, scanY - beamHalf, width, beamHalf * 2);
  // Sharper midline
  ctx.strokeStyle = withAlpha(color, 1);
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, scanY);
  ctx.lineTo(x + width, scanY);
  ctx.stroke();
  ctx.restore();

  // Heavy glowing corner brackets.
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22 + flashAlpha * 26;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5 + flashAlpha * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // top-left
  ctx.moveTo(x, y + bracket);
  ctx.lineTo(x, y);
  ctx.lineTo(x + bracket, y);
  // top-right
  ctx.moveTo(x + width - bracket, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + bracket);
  // bottom-right
  ctx.moveTo(x + width, y + height - bracket);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width - bracket, y + height);
  // bottom-left
  ctx.moveTo(x + bracket, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + height - bracket);
  ctx.stroke();
  ctx.restore();

  // Centroid crosshair — clearly says "tracked".
  ctx.save();
  ctx.strokeStyle = withAlpha(color, 0.8);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy);
  ctx.lineTo(cx + 8, cy);
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function withAlpha(hex: string, alpha: number): string {
  // hex like #rrggbb -> rgba()
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  id: number,
  category: Category,
  color: string,
) {
  const tagText = `ID ${String(id).padStart(2, '0')}`;
  const statusText = labelFor(category).toUpperCase();

  ctx.save();
  ctx.font = "700 13px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textBaseline = 'middle';
  const tagWidth = ctx.measureText(tagText).width;
  const statusWidth = ctx.measureText(statusText).width;

  const padX = 9;
  const gap = 8;
  const dotW = 14;
  const labelW = dotW + tagWidth + gap + statusWidth + padX * 2;
  const labelH = 26;
  const labelX = box.x;
  const labelY = box.y - labelH - 8;

  // Background pill.
  ctx.fillStyle = 'rgba(8, 10, 14, 0.92)';
  roundRect(ctx, labelX, labelY, labelW, labelH, 7);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  roundRect(ctx, labelX, labelY, labelW, labelH, 7);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Pulsing color dot.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(labelX + padX + 3, labelY + labelH / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // ID text (muted)
  ctx.fillStyle = '#c8cad6';
  ctx.fillText(tagText, labelX + padX + dotW, labelY + labelH / 2 + 1);

  // Status text (category color)
  ctx.fillStyle = color;
  ctx.fillText(
    statusText,
    labelX + padX + dotW + tagWidth + gap,
    labelY + labelH / 2 + 1,
  );
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function labelFor(category: Category): string {
  switch (category) {
    case 'walked-by':
      return 'passing';
    case 'engaged':
      return 'engaged';
  }
}
