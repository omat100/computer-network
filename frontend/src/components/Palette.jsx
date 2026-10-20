import { GripVertical, LayoutGrid, Maximize, Monitor, Network } from 'lucide-react'
import { DEVICE_MIME } from '../topology/constants'

const DEVICES = [
  { type: 'Computer', hint: 'Host / endpoint', icon: Monitor },
  { type: 'Switch', hint: 'Network fabric', icon: Network },
]

export default function Palette({
  disabled,
  onAdd,
  onDragStartType,
  onDragEnd,
  onAutoLayout,
  onFitView,
}) {
  function handleDragStart(event, type) {
    if (disabled) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData(DEVICE_MIME, type)
    event.dataTransfer.effectAllowed = 'copy'
    onDragStartType?.(type)
  }

  return (
    <div className={`palette ${disabled ? 'is-disabled' : ''}`}>
      <div className="palette-grid">
        {DEVICES.map(({ type, hint, icon: Icon }) => (
          <button
            type="button"
            key={type}
            className="palette-item"
            draggable={!disabled}
            disabled={disabled}
            onDragStart={(event) => handleDragStart(event, type)}
            onDragEnd={onDragEnd}
            onClick={() => onAdd(type)}
            title={`Add a ${type.toLowerCase()}`}
          >
            <span className={`palette-device ${type === 'Switch' ? 'is-switch' : ''}`}>
              <Icon size={19} strokeWidth={1.8} />
            </span>
            <span className="palette-copy">
              <span className="palette-name">{type}</span>
              <span className="palette-hint">{hint}</span>
            </span>
            <GripVertical size={15} className="palette-grip" aria-hidden="true" />
          </button>
        ))}
      </div>

      <p className="palette-tip">
        Drag a card onto the canvas, then pull from a node&apos;s right port to
        another node&apos;s left port to create a cable.
      </p>

      <div className="palette-actions">
        <button
          type="button"
          className="palette-action"
          onClick={onAutoLayout}
          disabled={disabled}
        >
          <LayoutGrid size={14} />
          Auto layout
        </button>
        <button type="button" className="palette-action" onClick={onFitView}>
          <Maximize size={14} />
          Fit view
        </button>
      </div>
    </div>
  )
}
