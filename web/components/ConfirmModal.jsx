'use client';

import { useEffect } from 'react';

/**
 * Reusable confirmation dialog. Render it conditionally (when `open` is true)
 * and supply `onConfirm` / `onCancel`. Closes on Escape or backdrop click.
 *
 * Props:
 *  - title, message: dialog text
 *  - confirmLabel, cancelLabel: button text (defaults: Confirm / Cancel)
 *  - danger: style the confirm button as destructive (red)
 *  - busy: disables buttons while an async action runs
 */
export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={() => !busy && onCancel?.()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {message && <p className="muted">{message}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
