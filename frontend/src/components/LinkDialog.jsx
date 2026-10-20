import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Cable, Loader2, Monitor, Network, X } from 'lucide-react'

function DeviceLine({ device }) {
  const isSwitch = device?.type === 'Switch'
  const Icon = isSwitch ? Network : Monitor
  if (!device) return null

  return (
    <span className="dialog-device">
      <span className={`dialog-device-icon ${isSwitch ? 'is-switch' : ''}`}>
        <Icon size={15} strokeWidth={1.8} />
      </span>
      <span className="dialog-device-copy">
        <span>Device {device.id}</span>
        <span className="mono">{device.ip}</span>
      </span>
    </span>
  )
}

export default function LinkDialog({ sourceDevice, targetDevice, onCancel, onConfirm }) {
  const [cost, setCost] = useState('1')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !pending) onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, pending])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const value = Number(cost)
    if (!Number.isInteger(value) || value < 1) {
      setError('Cost must be a positive whole number.')
      return
    }

    setPending(true)
    try {
      await onConfirm(value)
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
        aria-labelledby="link-dialog-title"
      >
        <div className="modal-head">
          <div className="modal-title">
            <span className="modal-icon">
              <Cable size={17} />
            </span>
            <div>
              <p className="eyebrow">New connection</p>
              <h2 id="link-dialog-title">Create a link</h2>
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

        <div className="dialog-link">
          <DeviceLine device={sourceDevice} />
          <ArrowRight size={16} className="dialog-arrow" />
          <DeviceLine device={targetDevice} />
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Link cost</span>
            <input
              ref={inputRef}
              className="input mono"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              autoFocus
              disabled={pending}
            />
          </label>

          <p className="modal-note">
            The link is directional: {sourceDevice?.id} → {targetDevice?.id}. Add
            the reverse link separately if traffic must flow both ways.
          </p>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Cable size={14} />
                  Create link
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
