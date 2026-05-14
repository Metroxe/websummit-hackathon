import { useCallback, useRef, useState } from 'react';
import { CameraView, type FrameSnapshot } from './components/CameraView';
import { Hud, type CategoryCounts } from './components/Hud';
import { EventLog, type LogEvent } from './components/EventLog';
import { InfoModal } from './components/InfoModal';
import type { Category } from './lib/categorizer';
import './App.css';

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
    <div className="app">
      <CameraView onError={handleCameraError} onFrame={handleFrame} />
      <Hud counts={counts} />
      <EventLog events={events} />

      <button
        type="button"
        className="info-button"
        aria-label="About PassBy"
        onClick={() => setShowInfo(true)}
      >
        ?
      </button>

      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} />

      {error && (
        <div className="camera-error" role="alert">
          <strong>Camera error</strong>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
