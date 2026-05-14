import type { BoundingBox, Detection } from './detector';

export type TrackedPerson = {
  id: number;
  box: BoundingBox;
  color: string;
  firstSeenMs: number;
  lastSeenMs: number;
};

export type Tracker = {
  update: (detections: Detection[], timestampMs: number) => TrackedPerson[];
};

// M2 placeholder: assigns a fresh ID to every detection each frame.
// Replace with an IOU-based SORT-style tracker so IDs persist across frames.
export function createTracker(): Tracker {
  let nextId = 1;
  return {
    update(detections, timestampMs) {
      return detections.map((d) => {
        const id = nextId++;
        return {
          id,
          box: d.box,
          color: colorForId(id),
          firstSeenMs: timestampMs,
          lastSeenMs: timestampMs,
        };
      });
    },
  };
}

const PALETTE = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#a78bfa', '#f472b6',
  '#34d399', '#60a5fa', '#fb923c', '#f87171', '#22d3ee',
];

export function colorForId(id: number): string {
  return PALETTE[id % PALETTE.length];
}
