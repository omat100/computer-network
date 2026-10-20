import { Activity, Route, SlidersHorizontal, X } from 'lucide-react'
import Inspector from './Inspector'
import RouteTracer from './RouteTracer'
import ActivityLog from './ActivityLog'

const TABS = [
  { id: 'inspect', label: 'Inspector', icon: SlidersHorizontal },
  { id: 'trace', label: 'Trace', icon: Route },
  { id: 'log', label: 'Log', icon: Activity },
]

export default function SidePanel({
  open,
  tab,
  onTabChange,
  onClose,
  devices,
  links,
  selection,
  onSelect,
  onSetSource,
  onSetTarget,
  onTraceLink,
  onCopyIp,
  onDeleteDevice,
  onDeleteLink,
  route,
  source,
  destination,
  onSourceChange,
  onDestinationChange,
  onSwap,
  onTrace,
  onClearRoute,
  onReplayRoute,
  onSelectRouteDevice,
  routeError,
  tracing,
  events,
  onClearEvents,
}) {
  return (
    <aside
      id="studio-panel"
      className={`side-panel ${open ? 'is-open' : ''}`}
      aria-label="Studio panel"
    >
      <div className="side-tabs">
        <div className="side-tab-list" role="tablist" aria-label="Studio panels">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              role="tab"
              id={`studio-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`studio-tabpanel-${id}`}
              className={`side-tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => onTabChange(id)}
            >
              <Icon size={14} />
              {label}
              {id === 'trace' && route && <span className="tab-dot" aria-hidden="true" />}
              {id === 'log' && events.length > 0 && (
                <span className="tab-count">{events.length > 9 ? '9+' : events.length}</span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="icon-btn side-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div
        className="side-body"
        role="tabpanel"
        id={`studio-tabpanel-${tab}`}
        aria-labelledby={`studio-tab-${tab}`}
      >
        {tab === 'inspect' && (
          <Inspector
            selection={selection}
            devices={devices}
            links={links}
            onSelect={onSelect}
            onSetSource={onSetSource}
            onSetTarget={onSetTarget}
            onTraceLink={onTraceLink}
            onCopyIp={onCopyIp}
            onDeleteDevice={onDeleteDevice}
            onDeleteLink={onDeleteLink}
          />
        )}

        {tab === 'trace' && (
          <RouteTracer
            devices={devices}
            links={links}
            source={source}
            destination={destination}
            onSourceChange={onSourceChange}
            onDestinationChange={onDestinationChange}
            onSwap={onSwap}
            onTrace={onTrace}
            onClear={onClearRoute}
            onReplay={onReplayRoute}
            onSelectDevice={onSelectRouteDevice}
            route={route}
            error={routeError}
            tracing={tracing}
          />
        )}

        {tab === 'log' && <ActivityLog events={events} onClear={onClearEvents} />}
      </div>
    </aside>
  )
}
