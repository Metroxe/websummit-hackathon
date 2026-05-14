import {
  FilesetResolver,
  ObjectDetector,
  type ObjectDetectorResult,
  FaceLandmarker,
  type FaceLandmarkerResult,
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
  mouthOpenness: number;
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

const FACE_MODEL_URL = 
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function createDetector(): Promise<Detector> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  const [detector, faceLandmarker] = await Promise.all([
    ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      scoreThreshold: 0.4,
      categoryAllowlist: ['person'],
    }),
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: FACE_MODEL_URL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 10,
    })
  ]);

  return {
    async detect(video, timestampMs) {
      if (video.readyState < 2) return [];
      const objResult: ObjectDetectorResult = detector.detectForVideo(video, timestampMs);
      const faceResult: FaceLandmarkerResult = faceLandmarker.detectForVideo(video, timestampMs);

      // Map faces to their center coords and openness score
      const facesInfo = faceResult.faceLandmarks.map((landmarks) => {
        // Upper lip: 13, Lower lip: 14, Top of face: 10, Bottom of face: 152
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        const top = landmarks[10];
        const bottom = landmarks[152];
        
        // 2D distance calculation (landmarks are normalized 0-1)
        const faceHeight = Math.hypot(top.x - bottom.x, top.y - bottom.y) || 1;
        const mouthDistance = Math.hypot(upperLip.x - lowerLip.x, upperLip.y - lowerLip.y);
        const openness = mouthDistance / faceHeight;

        // Approximate center of face
        let cx = 0, cy = 0;
        for (const pt of landmarks) { cx += pt.x; cy += pt.y; }
        cx /= landmarks.length;
        cy /= landmarks.length;
        
        // Convert normalized center to pixel coordinates
        const pixelCx = cx * video.videoWidth;
        const pixelCy = cy * video.videoHeight;
        
        return { cx: pixelCx, cy: pixelCy, openness };
      });

      return objResult.detections.map((d) => {
        const b = d.boundingBox!;
        const box = {
          x: b.originX,
          y: b.originY,
          width: b.width,
          height: b.height,
        };

        // If a face falls within this bounding box, assign its openness
        let maxOpenness = 0;
        for (const face of facesInfo) {
          if (face.cx >= box.x && face.cx <= box.x + box.width &&
              face.cy >= box.y && face.cy <= box.y + box.height) {
            maxOpenness = Math.max(maxOpenness, face.openness);
          }
        }

        return {
          box,
          score: d.categories[0]?.score ?? 0,
          mouthOpenness: maxOpenness
        };
      });
    },
    dispose() {
      detector.close();
      faceLandmarker.close();
    },
  };
}
