import { useEffect, useRef, useState } from 'react';

export type CategoryCounts = {
  walkedBy: number;
  engaged: number;
};

type HudProps = {
  counts: CategoryCounts;
};

const TICK_DURATION_MS = 450;

export function Hud({ counts }: HudProps) {
  const total = counts.walkedBy + counts.engaged;
  const engagementRate = total > 0 ? (counts.engaged / total) * 100 : 0;
  const walkedPct = total > 0 ? (counts.walkedBy / total) * 100 : 0;
  const engagedPct = total > 0 ? (counts.engaged / total) * 100 : 0;

  return (
    <div className="pointer-events-none absolute top-6 right-6 z-20 w-[20rem] rounded-card bg-ink text-bg p-8 flex flex-col gap-8 tabular-nums border border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold tracking-tightest text-bg text-base">
          Passby
        </span>
        <span className="font-mono text-[11px] uppercase tracking-label text-zinc-400">
          Live
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-label text-zinc-400">
          Engagement rate
        </span>
        <div className="flex items-baseline gap-2 font-display font-bold tracking-tightest leading-none text-[#4ADE80]">
          <span className="text-6xl">
            <AnimatedNumber value={engagementRate} decimals={1} />
          </span>
          <span className="text-3xl opacity-70">%</span>
        </div>
        <p className="font-display text-sm text-zinc-400 leading-snug">
          <AnimatedNumber value={counts.engaged} /> of{' '}
          <AnimatedNumber value={total} /> passersby engaged
        </p>
      </div>

      <div className="flex flex-col gap-5 border-t border-zinc-800 pt-6">
        <FunnelRow
          label="Walked by"
          value={counts.walkedBy}
          pct={walkedPct}
          tone="muted"
        />
        <FunnelRow
          label="Engaged"
          value={counts.engaged}
          pct={engagedPct}
          tone="primary"
        />
      </div>
    </div>
  );
}

type FunnelRowProps = {
  label: string;
  value: number;
  pct: number;
  tone: 'muted' | 'primary';
};

function FunnelRow({ label, value, pct, tone }: FunnelRowProps) {
  const valueColor = tone === 'primary' ? 'text-[#4ADE80]' : 'text-zinc-400';
  const barFill = tone === 'primary' ? 'bg-[#4ADE80]' : 'bg-zinc-600';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-label text-zinc-400">
          {label}
        </span>
        <span
          className={`font-display text-xl font-semibold tracking-tightest ${valueColor}`}
        >
          <AnimatedNumber value={value} />
        </span>
      </div>
      <div className="h-px bg-zinc-800 relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barFill} transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
};

function AnimatedNumber({ value, decimals = 0 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(performance.now());

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    let rafId = 0;
    const target = value;

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const t = Math.min(1, elapsed / TICK_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}
