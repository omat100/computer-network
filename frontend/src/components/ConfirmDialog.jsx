import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'

export default function ConfirmDialog({
  eyebrow = 'Destructive action',
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !pending) onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, pending])

  async function handleConfirm() {
    setError('')
    setPending(true)
    try {
      await onConfirm()
    } catch (requestError) {
      setError(requestError.message)
      setPending(false)
    }
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="modal-head">
          <div className="modal-title">
            <span className="modal-icon is-danger">
              <AlertTriangle size={17} />
            </span>
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 id="confirm-dialog-title">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onCancel}
            disabled={pending}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="modal-note confirm-copy">{message}</p>

        {error && (
          <p className="form-error confirm-error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 size={14} className="spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
