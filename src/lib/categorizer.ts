import type { TrackedPerson } from './tracker';
import type { CategoryCounts } from '../components/Hud';

export type Category = 'walked-by' | 'looked' | 'talked';

export const CATEGORY_COLORS: Record<Category, string> = {
  'walked-by': '#9a9a9a',
  looked: '#f5c84a',
  talked: '#4caf50',
};

export type CategorizerResult = {
  counts: CategoryCounts;
  categories: Map<number, Category>;
};

export type Categorizer = {
  update: (tracked: TrackedPerson[], timestampMs: number) => CategorizerResult;
};

// A person counts as "talked" once their centroid has stayed within a small
// radius for at least DWELL_TIME_MS. Tune both during the demo.
const DWELL_RADIUS_PX = 80;
const DWELL_TIME_MS = 5000;
// Keep a bit more history than the dwell window so the check has a full span.
const HISTORY_WINDOW_MS = DWELL_TIME_MS + 1000;

type TrackState = {
  category: Category;
  history: Array<{ x: number; y: number; t: number }>;
};

export function createCategorizer(): Categorizer {
  const states = new Map<number, TrackState>();

  return {
    update(tracked, timestampMs) {
      const categories = new Map<number, Category>();

      for (const person of tracked) {
        let state = states.get(person.id);
        if (!state) {
          state = { category: 'walked-by', history: [] };
          states.set(person.id, state);
        }

        const cx = person.box.x + person.box.width / 2;
        const cy = person.box.y + person.box.height / 2;
        state.history.push({ x: cx, y: cy, t: timestampMs });

        const cutoff = timestampMs - HISTORY_WINDOW_MS;
        while (state.history.length > 0 && state.history[0].t < cutoff) {
          state.history.shift();
        }

        if (state.category !== 'talked' && hasDwelled(state.history, timestampMs)) {
          state.category = 'talked';
        }

        categories.set(person.id, state.category);
      }

      let walkedBy = 0;
      let looked = 0;
      let talked = 0;
      for (const state of states.values()) {
        if (state.category === 'talked') talked++;
        else if (state.category === 'looked') looked++;
        else walkedBy++;
      }

      return { counts: { walkedBy, looked, talked }, categories };
    },
  };
}

function hasDwelled(
  history: Array<{ x: number; y: number; t: number }>,
  now: number,
): boolean {
  if (history.length === 0) return false;
  if (now - history[0].t < DWELL_TIME_MS) return false;

  let minX = history[0].x;
  let maxX = history[0].x;
  let minY = history[0].y;
  let maxY = history[0].y;
  for (const p of history) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return Math.hypot(maxX - minX, maxY - minY) <= DWELL_RADIUS_PX * 2;
}
