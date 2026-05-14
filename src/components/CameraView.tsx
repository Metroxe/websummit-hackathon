import { useEffect, useRef } from 'react';
import { createDetector, type Detection, type Detector } from '../lib/detector';
import { createTracker, type TrackedPerson, type Tracker } from '../lib/tracker';
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

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onError('Could not get 2D canvas context.');
          return;
        }

        onCountsChange({ walkedBy: 0, looked: 0, talked: 0 });

        const loop = async () => {
          if (cancelled) return;

          let tracked: TrackedPerson[] = [];
          try {
            const now = performance.now();
            const detections: Detection[] = (await detector?.detect(video, now)) ?? [];
            tracked = tracker?.update(detections, now) ?? [];
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('detection frame failed', err);
          }

          drawOverlay(ctx, canvas, tracked);
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
  tracked: TrackedPerson[],
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 3;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textBaseline = 'top';

  for (const { id, box, color } of tracked) {
    ctx.strokeStyle = color;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    const label = `#${id}`;
    const padding = 6;
    const labelWidth = ctx.measureText(label).width + padding * 2;
    const labelHeight = 22;
    const labelX = box.x;
    const labelY = box.y - labelHeight - 2;

    ctx.fillStyle = color;
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    ctx.fillStyle = '#000000';
    ctx.fillText(label, labelX + padding, labelY + 3);
  }
}
