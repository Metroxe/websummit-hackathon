import { useEffect } from 'react';

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
};

export function InfoModal({ open, onClose }: InfoModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-[min(36rem,calc(100%-2.5rem))] rounded-card bg-surface p-10 text-ink">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:border-ink hover:text-ink"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>

        <span className="font-mono text-xs uppercase tracking-label text-muted">
          Passby
        </span>

        <h2 id="modal-title" className="mt-6 text-ink">
          <span className="block font-display text-5xl font-semibold tracking-tight leading-[1.05]">
            How many actually
          </span>
          <span className="block font-display text-5xl font-normal tracking-tight leading-[1.05]">
            stopped?
          </span>
        </h2>

        <p className="mt-6 font-display text-lg text-ink leading-snug">
          Webcam-driven booth analytics. Point a laptop at the foot-traffic in
          front of a sponsor's booth and Passby tallies how many of the
          passersby actually engaged.
        </p>

        <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-line pt-8 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <dt className="font-mono text-xs uppercase tracking-label text-muted">
              Walked by
            </dt>
            <dd className="font-display text-base text-ink leading-snug">
              Passed through the frame, didn't stop.
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="font-mono text-xs uppercase tracking-label text-muted">
              Engaged
            </dt>
            <dd className="font-display text-base text-ink leading-snug">
              Lingered in front of the booth for a few seconds.
            </dd>
          </div>
        </dl>

        <p className="mt-8 font-mono text-xs uppercase tracking-label text-muted">
          Runs in browser · No video leaves the device
        </p>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 font-display text-sm font-medium text-bg hover:bg-zinc-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
