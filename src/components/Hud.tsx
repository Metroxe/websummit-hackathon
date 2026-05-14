import { useEffect, useRef, useState } from 'react';
import './Hud.css';

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
    <div className="hud">
      <div className="hud__row hud__row--top">
        <div className="hud__brand">
          <span className="hud__brand-lights" aria-hidden>
            <span className="hud__brand-light hud__brand-light--grey" />
            <span className="hud__brand-light hud__brand-light--green" />
          </span>
          <span className="hud__brand-name">PassBy</span>
        </div>
        <div className="hud__live">
          <span className="hud__live-dot" />
          LIVE
        </div>
      </div>

      <div className="hud__hero">
        <div className="hud__hero-label">Engagement rate</div>
        <div className="hud__hero-value">
          <AnimatedNumber value={engagementRate} decimals={1} />
          <span className="hud__hero-unit">%</span>
        </div>
        <div className="hud__hero-sub">
          <AnimatedNumber value={counts.engaged} /> of <AnimatedNumber value={total} /> passersby engaged
        </div>
      </div>

      <div className="hud__funnel">
        <FunnelRow
          label="Walked by"
          value={counts.walkedBy}
          pct={walkedPct}
          color="grey"
        />
        <FunnelRow
          label="Engaged"
          value={counts.engaged}
          pct={engagedPct}
          color="green"
        />
      </div>
    </div>
  );
}

type FunnelRowProps = {
  label: string;
  value: number;
  pct: number;
  color: 'grey' | 'green';
};

function FunnelRow({ label, value, pct, color }: FunnelRowProps) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`funnel ${flash ? 'funnel--flash' : ''}`}>
      <div className="funnel__head">
        <span className={`funnel__swatch funnel__swatch--${color}`} />
        <span className="funnel__label">{label}</span>
        <span className="funnel__value">
          <AnimatedNumber value={value} />
        </span>
      </div>
      <div className="funnel__bar">
        <div
          className={`funnel__bar-fill funnel__bar-fill--${color}`}
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
