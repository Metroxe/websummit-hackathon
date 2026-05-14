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

export type FrameSnapshot = {
  counts: CategoryCounts;
  categories: Map<number, Category>;
  timestamp: number;
};

type CameraViewProps = {
  onError: (message: string) => void;
  onFrame: (snap: FrameSnapshot) => void;
};

type DisplayedTrack = {
  id: number;
  box: { x: number; y: number; width: number; height: number };
  target: { x: number; y: number; width: number; height: number };
  firstSeenMs: number;
  lastSeenMs: number;
};

// How aggressively the on-screen box chases the latest detection per rAF.
const BOX_LERP = 0.35;

export function CameraView({ onError, onFrame }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let stream: MediaStream | null = null;
    let rafId = 0;
    let detectTimer: number | null = null;
    let cancelled = false;
    let detector: Detector | null = null;
    let tracker: Tracker | null = null;
    let categorizer: Categorizer | null = null;

    const displayed = new Map<number, DisplayedTrack>();
    let latestCategories = new Map<number, Category>();

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

        const detectLoop = async () => {
          if (cancelled) return;
          const now = performance.now();
          try {
            const detections: Detection[] = (await detector?.detect(video, now)) ?? [];
            const tracked = tracker?.update(detections, now) ?? [];

            const result = categorizer?.update(tracked, now);
            if (result) {
              latestCategories = result.categories;
              onFrame({
                counts: result.counts,
                categories: result.categories,
                timestamp: now,
              });
            }

            const seen = new Set<number>();
            for (const t of tracked) {
              seen.add(t.id);
              const prev = displayed.get(t.id);
              if (prev) {
                prev.target = t.box;
                prev.lastSeenMs = t.lastSeenMs;
              } else {
                displayed.set(t.id, {
                  id: t.id,
                  box: { ...t.box },
                  target: t.box,
                  firstSeenMs: t.firstSeenMs,
                  lastSeenMs: t.lastSeenMs,
                });
              }
            }
            for (const id of [...displayed.keys()]) {
              if (!seen.has(id)) displayed.delete(id);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('detection frame failed', err);
          }

          if (!cancelled) detectTimer = window.setTimeout(detectLoop, 0);
        };

        const renderLoop = () => {
          if (cancelled) return;

          const tracked: TrackedPerson[] = [];
          for (const d of displayed.values()) {
            d.box = {
              x: lerp(d.box.x, d.target.x, BOX_LERP),
              y: lerp(d.box.y, d.target.y, BOX_LERP),
              width: lerp(d.box.width, d.target.width, BOX_LERP),
              height: lerp(d.box.height, d.target.height, BOX_LERP),
            };
            tracked.push({
              id: d.id,
              box: d.box,
              firstSeenMs: d.firstSeenMs,
              lastSeenMs: d.lastSeenMs,
            });
          }

          drawOverlay(ctx, canvas, tracked, latestCategories);
          rafId = requestAnimationFrame(renderLoop);
        };

        void detectLoop();
        rafId = requestAnimationFrame(renderLoop);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start camera.';
        onError(message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (detectTimer != null) clearTimeout(detectTimer);
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
    <div className="absolute inset-0 flex items-center justify-center bg-ink">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tracked: TrackedPerson[],
  categories: Map<number, Category>,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const { id, box } of tracked) {
    const category = categories.get(id) ?? 'walked-by';
    const color = CATEGORY_COLORS[category];
    drawBox(ctx, box, color, category === 'engaged');
    drawLabel(ctx, box, id, category, color);
  }
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  color: string,
  emphasized: boolean,
) {
  const { x, y, width, height } = box;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = emphasized ? 2 : 1.25;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; width: number; height: number },
  id: number,
  category: Category,
  color: string,
) {
  const idText = `#${String(id).padStart(2, '0')}`;
  const statusText = labelFor(category).toUpperCase();
  const text = `${idText}  ${statusText}`;

  ctx.save();
  // IBM Plex Mono uppercase with wide tracking — our `label` voice.
  ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textBaseline = 'middle';

  // Approximate Tailwind's tracking-label (~0.12em) by inserting spaces; the
  // canvas API has no native letter-spacing, so this is a deliberate compromise.
  const textWidth = ctx.measureText(text).width;
  const padX = 10;
  const labelW = textWidth + padX * 2;
  const labelH = 22;
  const labelX = box.x;
  const labelY = Math.max(0, box.y - labelH - 6);

  // Solid ink pill with thin colored border — no shadow, no gradient.
  ctx.fillStyle = '#18181B';
  ctx.fillRect(labelX, labelY, labelW, labelH);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX + 0.5, labelY + 0.5, labelW - 1, labelH - 1);

  ctx.fillStyle = color;
  ctx.fillText(text, labelX + padX, labelY + labelH / 2 + 1);
  ctx.restore();
}

function labelFor(category: Category): string {
  switch (category) {
    case 'walked-by':
      return 'Passing';
    case 'engaged':
      return 'Engaged';
  }
}
