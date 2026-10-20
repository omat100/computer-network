import {
  ArrowDownLeft,
  ArrowUpRight,
  Cable,
  ChevronRight,
  Copy,
  Flag,
  Lightbulb,
  Monitor,
  MousePointer2,
  Network,
  Play,
  Trash2,
} from 'lucide-react'

function DeviceAvatar({ type, className = '' }) {
  const isSwitch = type === 'Switch'
  const Icon = isSwitch ? Network : Monitor
  return (
    <span
      className={`inspect-avatar ${isSwitch ? 'is-switch' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <Icon size={20} strokeWidth={1.8} />
    </span>
  )
}

function LinkRow({ link, other, direction, onSelect }) {
  return (
    <button
      type="button"
      className="inspector-link"
      onClick={() => onSelect({ kind: 'link', id: link.id })}
    >
      <span className={`link-direction ${direction}`} aria-hidden="true">
        {direction === 'out' ? (
          <ArrowUpRight size={14} />
        ) : (
          <ArrowDownLeft size={14} />
        )}
      </span>
      <span className="link-row-main">
        <span>Device {other?.id ?? '?'}</span>
        <span className="mono">{other?.ip ?? 'unknown'}</span>
      </span>
      <span className="cost-chip">cost {link.cost}</span>
      <ChevronRight size={14} className="row-chevron" aria-hidden="true" />
    </button>
  )
}

function EmptyLinks({ children }) {
  return <p className="side-note muted">{children}</p>
}

export default function Inspector({
  selection,
  devices,
  links,
  onSelect,
  onSetSource,
  onSetTarget,
  onTraceLink,
  onCopyIp,
  onDeleteDevice,
  onDeleteLink,
}) {
  const switches = devices.filter((device) => device.type === 'Switch').length

  if (!selection) {
    return (
      <div className="inspector">
        <div className="overview">
          <span className="overview-icon" aria-hidden="true">
            <MousePointer2 size={22} strokeWidth={1.7} />
          </span>
          <h2>Topology overview</h2>
          <p>Select a device or a link on the canvas to inspect it.</p>
        </div>

        <div className="overview-stats">
          <div>
            <dt>Devices</dt>
            <dd>{devices.length}</dd>
          </div>
          <div>
            <dt>Links</dt>
            <dd>{links.length}</dd>
          </div>
          <div>
            <dt>Switches</dt>
            <dd>{switches}</dd>
          </div>
          <div>
            <dt>Hosts</dt>
            <dd>{devices.length - switches}</dd>
          </div>
        </div>

        <section className="panel-section">
          <h3 className="section-title">
            <Lightbulb size={13} />
            Quick start
          </h3>
          <ol className="tips">
            <li>
              <span>1</span>
              Drag a computer or switch from the palette onto the canvas.
            </li>
            <li>
              <span>2</span>
              Pull a cable from a node&apos;s right port to another node&apos;s
              left port.
            </li>
            <li>
              <span>3</span>
              Open the Route tracer tab to animate the shortest path.
            </li>
          </ol>
        </section>
      </div>
    )
  }

  if (selection.kind === 'link') {
    const link = links.find((entry) => entry.id === selection.id)
    if (!link) {
      return (
        <div className="inspector">
          <p className="side-note muted">This link is no longer available.</p>
        </div>
      )
    }

    const source = devices.find((device) => device.id === link.source)
    const target = devices.find((device) => device.id === link.target)

    return (
      <div className="inspector">
        <div className="inspect-hero">
          <span className="inspect-avatar is-link" aria-hidden="true">
            <Cable size={20} strokeWidth={1.8} />
          </span>
          <div className="inspect-title">
            <h2>
              Link {link.source} → {link.target}
            </h2>
            <p>
              <span className="type-tag">directional</span>
              <span className="mono">#{link.id}</span>
            </p>
          </div>
        </div>

        <div className="inspect-stats">
          <div>
            <dt>Cost</dt>
            <dd>{link.cost}</dd>
          </div>
          <div>
            <dt>Hops</dt>
            <dd>1</dd>
          </div>
        </div>

        <section className="panel-section">
          <h3 className="section-title">Endpoints</h3>
          <div className="endpoint-list">
            {[
              { device: source, label: 'Source' },
              { device: target, label: 'Destination' },
            ].map(({ device, label }) =>
              device ? (
                <button
                  type="button"
                  key={label}
                  className="endpoint"
                  onClick={() => onSelect({ kind: 'device', id: device.id })}
                >
                  <DeviceAvatar type={device.type} />
                  <span className="endpoint-copy">
                    <span className="endpoint-label">{label}</span>
                    <span>Device {device.id}</span>
                    <span className="mono">{device.ip}</span>
                  </span>
                  <ChevronRight size={14} className="row-chevron" aria-hidden="true" />
                </button>
              ) : null,
            )}
          </div>
        </section>

        <button
          type="button"
          className="btn btn-primary wide"
          onClick={() => onTraceLink(link.source, link.target)}
        >
          <Play size={14} />
          Trace this link
        </button>

        <div className="inspect-danger">
          <button
            type="button"
            className="btn btn-danger-ghost wide"
            onClick={() => onDeleteLink(link)}
          >
            <Trash2 size={14} />
            Delete link
          </button>
          <p className="side-note">
            This removes only the one-way link {link.source} → {link.target}.
          </p>
        </div>

        <p className="side-note">
          Links are one-way. Create a second link in the opposite direction for
          return traffic.
        </p>
      </div>
    )
  }

  const device = devices.find((entry) => entry.id === selection.id)
  if (!device) {
    return (
      <div className="inspector">
        <p className="side-note muted">This device is no longer available.</p>
      </div>
    )
  }

  const devicesById = new Map(devices.map((entry) => [entry.id, entry]))
  const outbound = links.filter((link) => link.source === device.id)
  const inbound = links.filter((link) => link.target === device.id)

  return (
    <div className="inspector">
      <div className="inspect-hero">
        <DeviceAvatar type={device.type} />
        <div className="inspect-title">
          <h2>Device {device.id}</h2>
          <p>
            <span className="type-tag">{device.type}</span>
            <span className="mono">{device.ip}</span>
            <button
              type="button"
              className="copy-btn"
              onClick={() => onCopyIp(device.ip)}
              title="Copy IP address"
              aria-label="Copy IP address"
            >
              <Copy size={12} />
            </button>
          </p>
        </div>
      </div>

      <div className="inspect-actions">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSetSource(device.id)}>
          <Play size={13} />
          Trace from
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSetTarget(device.id)}>
          <Flag size={13} />
          Trace to
        </button>
      </div>

      <div className="inspect-stats">
        <div>
          <dt>Outbound</dt>
          <dd>{outbound.length}</dd>
        </div>
        <div>
          <dt>Inbound</dt>
          <dd>{inbound.length}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{outbound.length + inbound.length}</dd>
        </div>
      </div>

      <section className="panel-section">
        <div className="section-title-row">
          <h3 className="section-title">
            Outbound links
            <span className="section-count">{outbound.length}</span>
          </h3>
          <span className="section-hint">source → target</span>
        </div>
        {outbound.length === 0 ? (
          <EmptyLinks>
            No outbound links yet. Drag from this node&apos;s right port to cable
            it.
          </EmptyLinks>
        ) : (
          <div className="inspector-links">
            {outbound.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                other={devicesById.get(link.target)}
                direction="out"
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </section>

      <section className="panel-section">
        <div className="section-title-row">
          <h3 className="section-title">
            Inbound links
            <span className="section-count">{inbound.length}</span>
          </h3>
        </div>
        {inbound.length === 0 ? (
          <EmptyLinks>No inbound links yet.</EmptyLinks>
        ) : (
          <div className="inspector-links">
            {inbound.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                other={devicesById.get(link.source)}
                direction="in"
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </section>

      <div className="inspect-danger">
        <button
          type="button"
          className="btn btn-danger-ghost wide"
          onClick={() => onDeleteDevice(device)}
        >
          <Trash2 size={14} />
          Delete device
        </button>
        <p className="side-note">
          {outbound.length + inbound.length > 0
            ? `This also removes ${outbound.length + inbound.length} connected ${
                outbound.length + inbound.length === 1 ? 'link' : 'links'
              }.`
            : 'This device has no links connected to it.'}
        </p>
      </div>
    </div>
  )
}
