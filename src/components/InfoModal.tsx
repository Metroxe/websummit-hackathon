import { useEffect } from 'react';
import './InfoModal.css';

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
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <button
          type="button"
          className="modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="modal__brand">
          <div className="modal__brand-lights" aria-hidden>
            <span className="modal__brand-light modal__brand-light--grey" />
            <span className="modal__brand-light modal__brand-light--green" />
          </div>
          <span className="modal__brand-name">PassBy</span>
        </div>

        <h2 id="modal-title" className="modal__title">
          How many actually <span className="modal__accent">stopped</span>?
        </h2>
        <p className="modal__sub">
          Webcam-driven booth analytics. Point a laptop at the foot-traffic in
          front of a sponsor's booth and PassBy tallies how many of the
          passersby actually engaged.
        </p>

        <div className="modal__legend">
          <div className="modal__legend-item">
            <span className="modal__swatch modal__swatch--grey" />
            <div>
              <div className="modal__legend-label">Walked by</div>
              <div className="modal__legend-desc">
                Passed through the frame, didn't stop.
              </div>
            </div>
          </div>
          <div className="modal__legend-item">
            <span className="modal__swatch modal__swatch--green" />
            <div>
              <div className="modal__legend-label">Engaged</div>
              <div className="modal__legend-desc">
                Lingered in front of the booth for at least a few seconds.
              </div>
            </div>
          </div>
        </div>

        <div className="modal__footnote">
          Runs entirely in your browser — no video leaves the device. No
          backend, no recording.
        </div>

        <button type="button" className="modal__cta" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
