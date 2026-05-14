import { useCallback, useRef, useState } from 'react';
import { CameraView, type FrameSnapshot } from './components/CameraView';
import { Hud, type CategoryCounts } from './components/Hud';
import { EventLog, type LogEvent } from './components/EventLog';
import { InfoModal } from './components/InfoModal';
import type { Category } from './lib/categorizer';

const MAX_LOG_EVENTS = 40;

export function App() {
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [counts, setCounts] = useState<CategoryCounts>({
    walkedBy: 0,
    engaged: 0,
  });
  const [events, setEvents] = useState<LogEvent[]>([]);
  const lastCategoryRef = useRef<Map<number, Category>>(new Map());

  const handleCameraError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleFrame = useCallback((snap: FrameSnapshot) => {
    setCounts(snap.counts);

    const prev = lastCategoryRef.current;
    const next = new Map<number, Category>();
    const newEvents: LogEvent[] = [];
    for (const [id, category] of snap.categories) {
      next.set(id, category);
      const previous = prev.get(id);
      if (previous === undefined) {
        newEvents.push({ ts: snap.timestamp, id, from: null, to: category });
      } else if (previous !== category) {
        newEvents.push({ ts: snap.timestamp, id, from: previous, to: category });
      }
    }
    lastCategoryRef.current = next;

    if (newEvents.length > 0) {
      setEvents((current) => {
        const merged = [...newEvents.reverse(), ...current];
        return merged.length > MAX_LOG_EVENTS
          ? merged.slice(0, MAX_LOG_EVENTS)
          : merged;
      });
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg text-ink">
      <CameraView onError={handleCameraError} onFrame={handleFrame} />
      <Hud counts={counts} />
      <EventLog events={events} />

      <button
        type="button"
        aria-label="About Passby"
        onClick={() => setShowInfo(true)}
        className="absolute bottom-6 left-6 z-30 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-mono text-[11px] uppercase tracking-label text-ink hover:bg-bg"
      >
        About
      </button>

      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} />

      {error && (
        <div
          role="alert"
          className="absolute bottom-6 right-6 z-30 flex max-w-sm flex-col gap-1 rounded-card bg-surface p-4 text-ink"
        >
          <span className="font-mono text-[11px] uppercase tracking-label text-muted">
            Camera error
          </span>
          <span className="font-display text-sm text-ink leading-snug">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
