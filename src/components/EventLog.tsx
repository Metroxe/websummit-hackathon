import { useMemo } from 'react';
import type { Category } from '../lib/categorizer';
import './EventLog.css';

export type LogEvent = {
  ts: number;
  id: number;
  from: Category | null;
  to: Category;
};

type EventLogProps = {
  events: LogEvent[];
};

const COLOR_CLASS: Record<Category, string> = {
  'walked-by': 'event__cat--grey',
  engaged: 'event__cat--green',
};

const SHORT_LABEL: Record<Category, string> = {
  'walked-by': 'passing',
  engaged: 'engaged',
};

export function EventLog({ events }: EventLogProps) {
  const startTs = useMemo(() => {
    if (events.length === 0) return performance.now();
    return events[events.length - 1].ts;
  }, [events]);

  return (
    <aside className="event-log" aria-label="Event log">
      <header className="event-log__head">
        <span className="event-log__title">Activity</span>
        <span className="event-log__count">{events.length}</span>
      </header>
      <ol className="event-log__list">
        {events.length === 0 ? (
          <li className="event-log__empty">Waiting for the first passerby…</li>
        ) : (
          events.map((event, index) => (
            <li
              key={`${event.id}-${event.ts}-${index}`}
              className={`event ${index === 0 ? 'event--new' : ''}`}
            >
              <span className="event__ts">{formatRelative(event.ts - startTs)}</span>
              <span className="event__id">#{event.id}</span>
              <span className="event__arrow">
                {event.from && (
                  <>
                    <span className={`event__cat ${COLOR_CLASS[event.from]}`}>
                      {SHORT_LABEL[event.from]}
                    </span>
                    <span className="event__sep">→</span>
                  </>
                )}
                <span className={`event__cat ${COLOR_CLASS[event.to]}`}>
                  {SHORT_LABEL[event.to]}
                </span>
              </span>
            </li>
          ))
        )}
      </ol>
    </aside>
  );
}

function formatRelative(deltaMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(deltaMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
