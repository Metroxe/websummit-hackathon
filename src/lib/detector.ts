import {
  FilesetResolver,
  ObjectDetector,
  type ObjectDetectorResult,
} from '@mediapipe/tasks-vision';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Detection = {
  box: BoundingBox;
  score: number;
};

export type Detector = {
  detect: (video: HTMLVideoElement, timestampMs: number) => Promise<Detection[]>;
  dispose: () => void;
};

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';

// EfficientDet-Lite0 is small and fast; good first pick for a hackathon demo.
// Swap to a heavier model later if accuracy matters more than latency.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite';

export async function createDetector(): Promise<Detector> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const detector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    scoreThreshold: 0.4,
    categoryAllowlist: ['person'],
  });

  return {
    async detect(video, timestampMs) {
      if (video.readyState < 2) return [];
      const result: ObjectDetectorResult = detector.detectForVideo(video, timestampMs);
      return result.detections.map((d) => {
        const b = d.boundingBox!;
        return {
          box: {
            x: b.originX,
            y: b.originY,
            width: b.width,
            height: b.height,
          },
          score: d.categories[0]?.score ?? 0,
        };
      });
    },
    dispose() {
      detector.close();
    },
  };
}
