import type { TrackedPerson } from './tracker';
import type { CategoryCounts } from '../components/Hud';

export type Category = 'walked-by' | 'looked' | 'talked';

export type Categorizer = {
  update: (tracked: TrackedPerson[], timestampMs: number) => CategoryCounts;
};

// M3 placeholder: returns zeroed counts. Fill in dwell-time logic for
// "stopped-and-talked" off the tracker, and head-pose for "looked" using
// MediaPipe FaceLandmarker.
//
// Rules from SPEC.md:
//  - walked-by:  default; track exists briefly, moves through frame.
//  - looked:     head briefly oriented toward camera while moving.
//  - talked:     centroid stays within a small region for > T seconds.
// Categories can only upgrade (walked-by -> looked -> talked), never downgrade.
export function createCategorizer(): Categorizer {
  return {
    update(_tracked, _timestampMs) {
      return { walkedBy: 0, looked: 0, talked: 0 };
    },
  };
}
