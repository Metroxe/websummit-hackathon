import { useMemo } from 'react';
import type { Category } from '../lib/categorizer';

export type LogEvent = {
  ts: number;
  id: number;
  from: Category | null;
  to: Category;
};

type EventLogProps = {
  events: LogEvent[];
};

const SHORT_LABEL: Record<Category, string> = {
  'walked-by': 'Passing',
  engaged: 'Engaged',
};

const TONE: Record<Category, string> = {
  'walked-by': 'text-zinc-400',
  engaged: 'text-bg',
};

export function EventLog({ events }: EventLogProps) {
  const startTs = useMemo(() => {
    if (events.length === 0) return performance.now();
    return events[events.length - 1].ts;
  }, [events]);

  return (
    <aside
      aria-label="Event log"
      className="pointer-events-none absolute top-6 left-6 z-20 flex w-[19rem] max-h-[22rem] flex-col rounded-card bg-ink text-bg p-6 tabular-nums border border-zinc-800"
    >
      <header className="flex items-baseline justify-between border-b border-zinc-800 pb-4">
        <span className="font-mono text-[11px] uppercase tracking-label text-zinc-400">
          Activity
        </span>
        <span className="font-mono text-[11px] uppercase tracking-label text-zinc-400">
          {String(events.length).padStart(2, '0')}
        </span>
      </header>

      <ol className="m-0 list-none overflow-y-auto pl-0 pr-1 pt-2 [mask-image:linear-gradient(180deg,#000_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(180deg,#000_82%,transparent_100%)]">
        {events.length === 0 ? (
          <li className="py-4 font-display text-sm text-zinc-400">
            Waiting for the first passerby.
          </li>
        ) : (
          events.map((event, index) => (
            <li
              key={`${event.id}-${event.ts}-${index}`}
              className="grid grid-cols-[3.5rem_2.25rem_1fr] items-baseline gap-3 border-b border-zinc-800/70 py-3 last:border-b-0"
            >
              <span className="font-mono text-[11px] uppercase tracking-label text-zinc-500">
                {formatRelative(event.ts - startTs)}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-label text-zinc-400">
                #{String(event.id).padStart(2, '0')}
              </span>
              <span className="flex items-baseline justify-end gap-2">
                {event.from && (
                  <>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-label ${TONE[event.from]}`}
                    >
                      {SHORT_LABEL[event.from]}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-600">→</span>
                  </>
                )}
                <span
                  className={`font-mono text-[11px] uppercase tracking-label ${TONE[event.to]}`}
                >
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
