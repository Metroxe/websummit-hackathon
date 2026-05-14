import { useEffect, useRef } from 'react';
import { createDetector, type Detection, type Detector } from '../lib/detector';
import { createTracker, type Tracker, type TrackedPerson } from '../lib/tracker';
import { createCategorizer, type Categorizer } from '../lib/categorizer';
import type { CategoryCounts } from './Hud';
import './CameraView.css';

type CameraViewProps = {
  onError: (message: string) => void;
  onCountsChange: (counts: CategoryCounts) => void;
};

export function CameraView({ onError, onCountsChange }: CameraViewProps) {
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

        // Match canvas to the actual video frame size for accurate overlay alignment.
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

        const loop = async () => {
          if (cancelled) return;

          let detections: Detection[] = [];
          let tracked: TrackedPerson[] = [];
          try {
            detections = (await detector?.detect(video, performance.now())) ?? [];
            tracked = tracker?.update(detections, performance.now()) ?? [];
            const counts = categorizer?.update(tracked, performance.now()) ?? {
              walkedBy: 0,
              looked: 0,
              talked: 0,
            };
            onCountsChange(counts);
          } catch (err) {
            // Detection errors per-frame are non-fatal; surface them in console.
            // eslint-disable-next-line no-console
            console.warn('detection frame failed', err);
          }

          drawOverlay(ctx, canvas, tracked.length ? tracked : detections);
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
  }, [onError, onCountsChange]);

  return (
    <div className="camera-view">
      <video ref={videoRef} className="camera-view__video" playsInline muted />
      <canvas ref={canvasRef} className="camera-view__canvas" />
    </div>
  );
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  items: Array<Detection | TrackedPerson>,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 3;
  ctx.font = '16px system-ui, sans-serif';
  ctx.textBaseline = 'top';

  for (const item of items) {
    const color = 'color' in item && item.color ? item.color : '#ffffff';
    const label = 'id' in item ? `#${item.id}` : '';
    const { x, y, width, height } = item.box;

    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);

    if (label) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 20, ctx.measureText(label).width + 8, 20);
      ctx.fillStyle = '#000';
      ctx.fillText(label, x + 4, y - 18);
    }
  }
}
