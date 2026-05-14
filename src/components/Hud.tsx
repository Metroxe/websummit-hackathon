import './Hud.css';

export type CategoryCounts = {
  walkedBy: number;
  looked: number;
  talked: number;
};

type HudProps = {
  counts: CategoryCounts;
};

export function Hud({ counts }: HudProps) {
  return (
    <div className="hud">
      <Counter label="Walked by" value={counts.walkedBy} swatch="#9a9a9a" />
      <Counter label="Looked" value={counts.looked} swatch="#f5c84a" />
      <Counter label="Talked" value={counts.talked} swatch="#4caf50" />
    </div>
  );
}

type CounterProps = {
  label: string;
  value: number;
  swatch: string;
};

function Counter({ label, value, swatch }: CounterProps) {
  return (
    <div className="hud__counter">
      <span className="hud__swatch" style={{ background: swatch }} />
      <span className="hud__label">{label}</span>
      <span className="hud__value">{value}</span>
    </div>
  );
}
