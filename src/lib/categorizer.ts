import type { TrackedPerson } from './tracker';
import type { CategoryCounts } from '../components/Hud';

export type Category = 'walked-by' | 'engaged';

// Overlay sits on top of the live camera (dark), so we map the design tokens
// to their dark-mode inversions: muted = zinc-400, ink = near-white.
export const CATEGORY_COLORS: Record<Category, string> = {
  'walked-by': '#A1A1AA',
  engaged: '#FAFAFA',
};

export type CategorizerResult = {
  counts: CategoryCounts;
  categories: Map<number, Category>;
};

export type Categorizer = {
  update: (tracked: TrackedPerson[], timestampMs: number) => CategorizerResult;
};

// Keep a brief history of talking frames to smooth out detection.
const HISTORY_WINDOW_MS = 2000;

type TrackState = {
  category: Category;
  talkingHistory: Array<{ openness: number; t: number }>;
};

export function createCategorizer(): Categorizer {
  const states = new Map<number, TrackState>();

  return {
    update(tracked, timestampMs) {
      const categories = new Map<number, Category>();

      for (const person of tracked) {
        let state = states.get(person.id);
        if (!state) {
          state = { category: 'walked-by', talkingHistory: [] };
          states.set(person.id, state);
        }

        state.talkingHistory.push({ openness: person.mouthOpenness, t: timestampMs });

        const cutoff = timestampMs - HISTORY_WINDOW_MS;
        while (state.talkingHistory.length > 0 && state.talkingHistory[0].t < cutoff) {
          state.talkingHistory.shift();
        }

        if (state.category === 'walked-by') {
          if (hasTalked(state.talkingHistory)) {
            state.category = 'engaged';
          }
        }

        categories.set(person.id, state.category);
      }

      let walkedBy = 0;
      let engaged = 0;
      for (const state of states.values()) {
        if (state.category === 'engaged') engaged++;
        else walkedBy++;
      }

      return { counts: { walkedBy, engaged }, categories };
    },
  };
}

function hasTalked(
  talkingHistory: Array<{ openness: number; t: number }>,
): boolean {
  if (talkingHistory.length === 0) return false;
  // A simple threshold approach: if we see mouthOpenness > 0.05 a few times recently, they are talking.
  let talkingFrames = 0;
  for (const p of talkingHistory) {
    if (p.openness > 0.05) talkingFrames++;
  }
  // If we have at least 5 frames of talking, consider them engaged.
  return talkingFrames >= 5;
}

