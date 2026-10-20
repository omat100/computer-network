import { Activity, CheckCircle2, CircleAlert, Info, Trash2 } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: CircleAlert,
  info: Info,
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ActivityLog({ events, onClear }) {
  return (
    <div className="activity">
      <div className="activity-head">
        <div>
          <p className="eyebrow">Session</p>
          <h2>Activity log</h2>
        </div>
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          onClick={onClear}
          disabled={events.length === 0}
        >
          <Trash2 size={13} />
          Clear
        </button>
      </div>

      {events.length === 0 ? (
        <div className="activity-empty">
          <span className="activity-empty-icon" aria-hidden="true">
            <Activity size={20} strokeWidth={1.7} />
          </span>
          <p>No activity yet.</p>
          <p className="muted">Device, link, and tracer events appear here.</p>
        </div>
      ) : (
        <ol className="activity-list">
          {events.map((event) => {
            const Icon = ICONS[event.tone] ?? Info
            return (
              <li key={event.id} className={`activity-event is-${event.tone}`}>
                <Icon size={13} className="activity-icon" aria-hidden="true" />
                <span className="activity-text">{event.text}</span>
                <time className="activity-time" dateTime={new Date(event.time).toISOString()}>
                  {formatTime(event.time)}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
