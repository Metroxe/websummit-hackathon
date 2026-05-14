import type { BoundingBox, Detection } from './detector';

export type TrackedPerson = {
  id: number;
  box: BoundingBox;
  firstSeenMs: number;
  lastSeenMs: number;
  mouthOpenness: number;
};

export type Tracker = {
  update: (detections: Detection[], timestampMs: number) => TrackedPerson[];
};

const IOU_THRESHOLD = 0.3;
// Keep a track alive briefly through detection misses so the ID survives blinks.
const MAX_AGE_MS = 1500;

export function createTracker(): Tracker {
  let nextId = 1;
  let tracks: TrackedPerson[] = [];

  return {
    update(detections, timestampMs) {
      const pairs: Array<{ trackIdx: number; detIdx: number; iou: number }> = [];
      for (let ti = 0; ti < tracks.length; ti++) {
        for (let di = 0; di < detections.length; di++) {
          const score = iou(tracks[ti].box, detections[di].box);
          if (score >= IOU_THRESHOLD) {
            pairs.push({ trackIdx: ti, detIdx: di, iou: score });
          }
        }
      }
      pairs.sort((a, b) => b.iou - a.iou);

      const matchedTracks = new Set<number>();
      const matchedDets = new Set<number>();
      const visible: TrackedPerson[] = [];

      for (const p of pairs) {
        if (matchedTracks.has(p.trackIdx) || matchedDets.has(p.detIdx)) continue;
        matchedTracks.add(p.trackIdx);
        matchedDets.add(p.detIdx);
        const t = tracks[p.trackIdx];
        t.box = detections[p.detIdx].box;
        t.lastSeenMs = timestampMs;
        t.mouthOpenness = detections[p.detIdx].mouthOpenness;
        visible.push(t);
      }

      for (let di = 0; di < detections.length; di++) {
        if (matchedDets.has(di)) continue;
        const id = nextId++;
        const t: TrackedPerson = {
          id,
          box: detections[di].box,
          firstSeenMs: timestampMs,
          lastSeenMs: timestampMs,
          mouthOpenness: detections[di].mouthOpenness,
        };
        tracks.push(t);
        visible.push(t);
      }

      tracks = tracks.filter((t) => timestampMs - t.lastSeenMs <= MAX_AGE_MS);
      return visible;
    },
  };
}

function iou(a: BoundingBox, b: BoundingBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const iw = Math.max(0, x2 - x1);
  const ih = Math.max(0, y2 - y1);
  const inter = iw * ih;
  const union = a.width * a.height + b.width * b.height - inter;
  return union > 0 ? inter / union : 0;
}
