import {
  ArrowDown,
  ArrowLeftRight,
  CircleAlert,
  Loader2,
  Play,
  RotateCcw,
  Route,
  X,
} from 'lucide-react'

function HopConnector({ cost }) {
  return (
    <div className="hop-connector" aria-hidden="true">
      <span className="hop-line" />
      <span className="hop-cost">{cost != null ? `cost ${cost}` : 'hop'}</span>
      <ArrowDown size={12} />
    </div>
  )
}

export default function RouteTracer({
  devices,
  links,
  source,
  destination,
  onSourceChange,
  onDestinationChange,
  onSwap,
  onTrace,
  onClear,
  onReplay,
  onSelectDevice,
  route,
  error,
  tracing,
}) {
  const devicesById = new Map(devices.map((device) => [device.id, device]))
  const hops = route?.path?.length ? route.path.length - 1 : 0

  function linkCost(from, to) {
    return links.find((link) => link.source === from && link.target === to)?.cost
  }

  return (
    <div className="tracer">
      <div className="tracer-head">
        <div>
          <p className="eyebrow">Shortest path</p>
          <h2>Route tracer</h2>
        </div>
        <span className="algorithm-chip">BFS</span>
      </div>

      <form
        className="tracer-form"
        onSubmit={(event) => {
          event.preventDefault()
          onTrace()
        }}
      >
        <div className="endpoint-fields">
          <label className="field">
            <span>Source</span>
            <select
              className="select"
              value={source}
              onChange={(event) => onSourceChange(event.target.value)}
              disabled={tracing || devices.length === 0}
            >
              {devices.length === 0 && <option value="">No devices</option>}
              {devices.map((device) => (
                <option value={device.id} key={device.id}>
                  #{device.id} · {device.ip}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="swap-btn"
            onClick={onSwap}
            disabled={tracing || devices.length < 2}
            title="Swap source and target"
            aria-label="Swap source and target"
          >
            <ArrowLeftRight size={14} />
          </button>

          <label className="field">
            <span>Target</span>
            <select
              className="select"
              value={destination}
              onChange={(event) => onDestinationChange(event.target.value)}
              disabled={tracing || devices.length === 0}
            >
              {devices.length === 0 && <option value="">No devices</option>}
              {devices.map((device) => (
                <option value={device.id} key={device.id}>
                  #{device.id} · {device.ip}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary wide"
          disabled={tracing || devices.length === 0}
        >
          {tracing ? (
            <>
              <Loader2 size={14} className="spin" />
              Tracing…
            </>
          ) : (
            <>
              <Play size={14} />
              Trace route
            </>
          )}
        </button>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      {!route ? (
        <div className="tracer-empty">
          <span className="tracer-empty-icon" aria-hidden="true">
            <Route size={20} strokeWidth={1.7} />
          </span>
          <p>Pick two devices and trace the shortest path.</p>
          <p className="muted">
            The packet animation runs across the canvas, hop by hop.
          </p>
        </div>
      ) : route.path.length === 0 ? (
        <div className="tracer-result">
          <div className="result-alert is-warning">
            <CircleAlert size={16} />
            <div>
              <strong>No route found</strong>
              <p>
                There is no directed path from #{route.source} to #
                {route.destination}. Links only carry traffic in their arrow
                direction.
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost wide" onClick={onClear}>
            <X size={14} />
            Clear result
          </button>
        </div>
      ) : route.path.length === 1 ? (
        <div className="tracer-result">
          <div className="result-alert is-info">
            <Route size={16} />
            <div>
              <strong>Same device</strong>
              <p>
                Source and target are both device #{route.source}. Pick a
                different target to see a path.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="tracer-result">
          <div className="result-summary">
            <span className="result-dot" aria-hidden="true" />
            <span>Route found</span>
            <span className="result-separator">·</span>
            <strong>{hops} {hops === 1 ? 'hop' : 'hops'}</strong>
            <span className="result-separator">·</span>
            <span>{route.path.length} nodes</span>
          </div>

          <ol className="hop-list">
            {route.path.map((id, index) => {
              const device = devicesById.get(id)
              const isSource = index === 0
              const isTarget = index === route.path.length - 1
              return (
                <li key={`${id}-${index}`}>
                  {index > 0 && (
                    <HopConnector cost={linkCost(route.path[index - 1], id)} />
                  )}
                  <button
                    type="button"
                    className={`hop ${isSource ? 'is-source' : ''} ${isTarget ? 'is-target' : ''}`}
                    onClick={() => onSelectDevice(id)}
                  >
                    <span className="hop-index">{index + 1}</span>
                    <span className="hop-copy">
                      <span>Device {id}</span>
                      <span className="mono">{device?.ip ?? 'unknown'}</span>
                    </span>
                    {isSource && <span className="hop-tag">src</span>}
                    {isTarget && <span className="hop-tag is-target">dst</span>}
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="tracer-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onReplay}>
              <RotateCcw size={13} />
              Replay packet
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={onClear}>
              <X size={13} />
              Clear
            </button>
          </div>

          <p className="tracer-note">
            <span className="pulse-dot" aria-hidden="true" />
            Packet replay runs on the canvas, one hop at a time.
          </p>
        </div>
      )}
    </div>
  )
}
