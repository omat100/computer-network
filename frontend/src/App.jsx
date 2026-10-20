import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import {
  CheckCircle2,
  CircleAlert,
  Info,
  Moon,
  PanelRight,
  RefreshCw,
  Route,
  Sun,
} from 'lucide-react'
import './App.css'
import { api, fetchTopology } from './api'
import { Logo } from './components/Icons'
import TopologyCanvas from './components/TopologyCanvas'
import SidePanel from './components/SidePanel'
import LinkDialog from './components/LinkDialog'
import ConfirmDialog from './components/ConfirmDialog'
import {
  autoLayout,
  loadStoredPositions,
  persistPositions,
  resolvePositions,
} from './topology/layout'

const TOAST_ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
}

const THEME_KEY = 'netmap.theme.v1'

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage may be unavailable in private browsing modes.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function App() {
  const [devices, setDevices] = useState([])
  const [links, setLinks] = useState([])
  const [positions, setPositions] = useState(loadStoredPositions)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(null)

  const [selection, setSelection] = useState(null)
  const [tab, setTab] = useState('inspect')
  const [sideOpen, setSideOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)

  const [routeStart, setRouteStart] = useState('')
  const [routeEnd, setRouteEnd] = useState('')
  const [route, setRoute] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [tracing, setTracing] = useState(false)

  const [pendingLink, setPendingLink] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [seeding, setSeeding] = useState(false)
  const [notices, setNotices] = useState([])
  const [events, setEvents] = useState([])
  const [fitNonce, setFitNonce] = useState(0)

  const syncCounter = useRef(0)
  const reservedIds = useRef(new Set())
  const reservedIps = useRef(new Set())

  const notify = useCallback((tone, text) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setNotices((current) => [...current.slice(-2), { id, tone, text }])
    window.setTimeout(() => {
      setNotices((current) => current.filter((notice) => notice.id !== id))
    }, 4200)
  }, [])

  const pushEvent = useCallback((tone, text) => {
    setEvents((current) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          time: Date.now(),
          tone,
          text,
        },
        ...current,
      ].slice(0, 60),
    )
  }, [])

  const applyTopology = useCallback((data) => {
    setDevices(data.devices)
    setLinks(data.links)
    setOnline(true)
  }, [])

  useEffect(() => {
    let ignore = false
    const requestId = ++syncCounter.current

    async function boot() {
      try {
        const data = await fetchTopology()
        if (ignore || requestId !== syncCounter.current) return
        applyTopology(data)
        pushEvent(
          'info',
          `Topology synced · ${data.devices.length} nodes, ${data.links.length} links`,
        )
      } catch (requestError) {
        if (!ignore && requestId === syncCounter.current) {
          setOnline(false)
          setError(requestError.message)
          pushEvent('error', requestError.message)
        }
      } finally {
        if (!ignore && requestId === syncCounter.current) setLoading(false)
      }
    }

    boot()
    return () => {
      ignore = true
    }
  }, [applyTopology, pushEvent])

  const refreshTopology = useCallback(async () => {
    const requestId = ++syncCounter.current
    setRefreshing(true)

    try {
      const data = await fetchTopology()
      if (requestId !== syncCounter.current) return null
      applyTopology(data)
      return data
    } catch (requestError) {
      if (requestId === syncCounter.current) {
        setOnline(false)
        notify('error', requestError.message)
        pushEvent('error', requestError.message)
      }
      return null
    } finally {
      if (requestId === syncCounter.current) setRefreshing(false)
    }
  }, [applyTopology, notify, pushEvent])

  const resolvedPositions = useMemo(
    () => resolvePositions(devices, positions),
    [devices, positions],
  )

  const routeSource = devices.some(
    (device) => String(device.id) === routeStart,
  )
    ? routeStart
    : String(devices[0]?.id ?? '')

  const fallbackTarget = String(devices[1]?.id ?? devices[0]?.id ?? '')
  const routeDestination = devices.some(
    (device) => String(device.id) === routeEnd,
  )
    ? routeEnd
    : fallbackTarget

  const statusClass =
    online === null ? 'is-connecting' : online ? 'is-online' : 'is-offline'
  const statusLabel =
    online === null ? 'Connecting' : online ? 'API live' : 'API offline'

  const allocateIdentity = useCallback((list) => {
    const usedIds = new Set(list.map((device) => device.id))
    let id = 1
    while (usedIds.has(id) || reservedIds.current.has(id)) id += 1

    const usedIps = new Set(list.map((device) => device.ip))
    let host = 1
    let ip
    do {
      ip = `192.168.1.${host}`
      host += 1
    } while (usedIps.has(ip) || reservedIps.current.has(ip))

    return { id, ip }
  }, [])

  const handleMoveNode = useCallback((id, position) => {
    setPositions((current) => ({ ...current, [id]: position }))
  }, [])

  const handleSaveNode = useCallback(
    (id, position) => {
      setPositions((current) => {
        const next = { ...resolvePositions(devices, current), [id]: position }
        persistPositions(next)
        return next
      })
    },
    [devices],
  )

  const handleAutoLayout = useCallback(() => {
    if (devices.length === 0) return
    const next = autoLayout(devices)
    setPositions(next)
    persistPositions(next)
    setFitNonce((current) => current + 1)
    notify('info', 'Layout rearranged')
    pushEvent('info', 'Topology layout rearranged')
  }, [devices, notify, pushEvent])

  const handleCreateDevice = useCallback(
    async (type, position) => {
      if (loading || error) return

      const identity = allocateIdentity(devices)
      reservedIds.current.add(identity.id)
      reservedIps.current.add(identity.ip)

      try {
        await api.addDevice({ id: identity.id, type, ip: identity.ip })

        setPositions((current) => {
          const base = resolvePositions(devices, current)
          const next = { ...base, [identity.id]: position }
          persistPositions(next)
          return next
        })

        const data = await refreshTopology()
        if (data) {
          setSelection({ kind: 'device', id: identity.id })
          setTab('inspect')
          setSideOpen(true)
        }

        notify('success', `${type} #${identity.id} added · ${identity.ip}`)
        pushEvent(
          'success',
          `Added ${type.toLowerCase()} #${identity.id} (${identity.ip})`,
        )
      } catch (requestError) {
        notify('error', requestError.message)
        pushEvent('error', `Add device failed: ${requestError.message}`)
      } finally {
        reservedIds.current.delete(identity.id)
        reservedIps.current.delete(identity.ip)
      }
    },
    [
      allocateIdentity,
      devices,
      error,
      loading,
      notify,
      pushEvent,
      refreshTopology,
    ],
  )

  const handleRequestLink = useCallback(
    (source, target) => {
      if (source === target) {
        notify('error', "A device can't link to itself.")
        return
      }

      if (links.some((link) => link.source === source && link.target === target)) {
        notify('error', `Link ${source} → ${target} already exists.`)
        return
      }

      setPendingLink({ source, target })
    },
    [links, notify],
  )

  const handleConfirmLink = useCallback(
    async (cost) => {
      if (!pendingLink) return
      const { source, target } = pendingLink

      try {
        await api.addConnection({ source, destination: target, cost })
      } catch (requestError) {
        pushEvent('error', `Link failed: ${requestError.message}`)
        throw new Error(requestError.message, { cause: requestError })
      }

      setPendingLink(null)
      const data = await refreshTopology()
      if (data) {
        setSelection({ kind: 'link', id: `${source}-${target}` })
        setTab('inspect')
        setSideOpen(true)
      }

      notify('success', `Link ${source} → ${target} created`)
      pushEvent('success', `Linked #${source} → #${target} (cost ${cost})`)
    },
    [notify, pendingLink, pushEvent, refreshTopology],
  )

  const handleRequestDeleteDevice = useCallback((device) => {
    setPendingDelete({ kind: 'device', id: device.id })
  }, [])

  const handleRequestDeleteLink = useCallback((link) => {
    setPendingDelete({
      kind: 'link',
      id: link.id,
      source: link.source,
      target: link.target,
    })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return
    const target = pendingDelete

    try {
      if (target.kind === 'device') {
        await api.deleteDevice(target.id)
      } else {
        await api.deleteConnection(target.source, target.target)
      }
    } catch (requestError) {
      pushEvent('error', `Delete failed: ${requestError.message}`)
      throw new Error(requestError.message, { cause: requestError })
    }

    setPendingDelete(null)
    setRoute(null)
    setRouteError('')

    if (target.kind === 'device') {
      setPositions((current) => {
        const next = { ...current }
        delete next[target.id]
        persistPositions(next)
        return next
      })
      setSelection((current) =>
        current?.kind === 'device' && current.id === target.id ? null : current,
      )
      notify('success', `Device #${target.id} deleted`)
      pushEvent('warning', `Deleted device #${target.id} and its links`)
    } else {
      setSelection((current) =>
        current?.kind === 'link' && current.id === target.id ? null : current,
      )
      notify('success', `Link ${target.source} → ${target.target} deleted`)
      pushEvent(
        'warning',
        `Deleted link #${target.source} → #${target.target}`,
      )
    }

    await refreshTopology()
  }, [notify, pendingDelete, pushEvent, refreshTopology])

  const performTrace = useCallback(
    async (sourceId, targetId) => {
      setTracing(true)
      setRouteError('')

      try {
        const data = await api.findRoute(sourceId, targetId)
        const path = Array.isArray(data?.path) ? data.path : []
        const result = {
          source: Number(sourceId),
          destination: Number(targetId),
          path,
          key: Date.now(),
        }
        setRoute(result)

        if (path.length === 0) {
          pushEvent('warning', `No route #${sourceId} → #${targetId}`)
        } else if (path.length === 1) {
          pushEvent('info', `Trace #${sourceId} → #${targetId}: same device`)
        } else {
          notify('success', `Route found · ${path.length - 1} hops`)
          pushEvent(
            'success',
            `Traced #${sourceId} → #${targetId} · ${path.length - 1} hops`,
          )
        }

        return result
      } catch (requestError) {
        setRouteError(requestError.message)
        notify('error', requestError.message)
        pushEvent('error', `Trace failed: ${requestError.message}`)
        return null
      } finally {
        setTracing(false)
      }
    },
    [notify, pushEvent],
  )

  const handleTrace = useCallback(() => {
    if (!routeSource || !routeDestination) {
      setRouteError('Choose a source and target first.')
      return
    }
    setTab('trace')
    setSideOpen(true)
    performTrace(Number(routeSource), Number(routeDestination))
  }, [performTrace, routeDestination, routeSource])

  const handleTraceLink = useCallback(
    (sourceId, targetId) => {
      setRouteStart(String(sourceId))
      setRouteEnd(String(targetId))
      setTab('trace')
      setSideOpen(true)
      performTrace(sourceId, targetId)
    },
    [performTrace],
  )

  const handleClearRoute = useCallback(() => {
    setRoute(null)
    setRouteError('')
  }, [])

  const handleReplayRoute = useCallback(() => {
    setRoute((current) => (current ? { ...current, key: Date.now() } : current))
  }, [])

  const handleSourceChange = useCallback((value) => {
    setRouteStart(value)
    setRoute(null)
    setRouteError('')
  }, [])

  const handleDestinationChange = useCallback((value) => {
    setRouteEnd(value)
    setRoute(null)
    setRouteError('')
  }, [])

  const handleSwap = useCallback(() => {
    setRouteStart(routeDestination)
    setRouteEnd(routeSource)
    setRoute(null)
    setRouteError('')
  }, [routeDestination, routeSource])

  const handleSetSource = useCallback(
    (id) => {
      const value = String(id)
      setRouteStart(value)
      setRoute(null)
      setRouteError('')
      setTab('trace')
      setSideOpen(true)

      if (routeDestination === value) {
        const other = devices.find((device) => device.id !== id)
        if (other) setRouteEnd(String(other.id))
      }
    },
    [devices, routeDestination],
  )

  const handleSetTarget = useCallback(
    (id) => {
      const value = String(id)
      setRouteEnd(value)
      setRoute(null)
      setRouteError('')
      setTab('trace')
      setSideOpen(true)

      if (routeSource === value) {
        const other = devices.find((device) => device.id !== id)
        if (other) setRouteStart(String(other.id))
      }
    },
    [devices, routeSource],
  )

  const handleCanvasSelect = useCallback((next) => {
    setSelection(next)
    if (next) {
      setTab('inspect')
      setSideOpen(true)
    }
  }, [])

  const handlePanelSelect = useCallback((next) => {
    setSelection(next)
  }, [])

  const handleRouteDevice = useCallback((id) => {
    setSelection({ kind: 'device', id })
  }, [])

  const handleCopyIp = useCallback(
    async (ip) => {
      try {
        await navigator.clipboard.writeText(ip)
        notify('success', `${ip} copied`)
      } catch {
        notify('error', 'Could not copy the IP address.')
      }
    },
    [notify],
  )

  const handleClearEvents = useCallback(() => setEvents([]), [])

  const handleRefresh = useCallback(async () => {
    const data = await refreshTopology()
    if (data) {
      notify('success', 'Topology refreshed')
      pushEvent(
        'info',
        `Refreshed · ${data.devices.length} nodes, ${data.links.length} links`,
      )
    }
  }, [notify, pushEvent, refreshTopology])

  const handleRetry = useCallback(async () => {
    const requestId = ++syncCounter.current
    setLoading(true)
    setError('')

    try {
      const data = await fetchTopology()
      if (requestId !== syncCounter.current) return
      applyTopology(data)
      pushEvent(
        'info',
        `Topology synced · ${data.devices.length} nodes, ${data.links.length} links`,
      )
    } catch (requestError) {
      if (requestId === syncCounter.current) {
        setOnline(false)
        setError(requestError.message)
        pushEvent('error', requestError.message)
      }
    } finally {
      if (requestId === syncCounter.current) setLoading(false)
    }
  }, [applyTopology, pushEvent])

  const handleLoadSample = useCallback(async () => {
    if (seeding) return
    setSeeding(true)

    const reserved = []
    const created = []
    const virtual = devices.map((device) => ({
      id: device.id,
      ip: device.ip,
    }))

    try {
      const specs = [
        { type: 'Computer', position: { x: -420, y: -40 } },
        { type: 'Switch', position: { x: -180, y: -40 } },
        { type: 'Switch', position: { x: 70, y: -40 } },
        { type: 'Computer', position: { x: 340, y: -140 } },
        { type: 'Computer', position: { x: 340, y: 40 } },
        { type: 'Computer', position: { x: -180, y: 140 } },
      ]

      for (const spec of specs) {
        const identity = allocateIdentity(virtual)
        reserved.push(identity)
        reservedIds.current.add(identity.id)
        reservedIps.current.add(identity.ip)
        await api.addDevice({
          id: identity.id,
          type: spec.type,
          ip: identity.ip,
        })
        created.push({ ...identity, type: spec.type, position: spec.position })
        virtual.push({ id: identity.id, ip: identity.ip })
      }

      const pairs = [
        [0, 1, 1],
        [5, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
        [2, 4, 1],
      ]
      for (const [source, target, cost] of pairs) {
        await api.addConnection({
          source: created[source].id,
          destination: created[target].id,
          cost,
        })
      }

      setPositions((current) => {
        const base = resolvePositions(devices, current)
        const next = { ...base }
        created.forEach((device) => {
          next[device.id] = device.position
        })
        persistPositions(next)
        return next
      })

      const data = await refreshTopology()
      if (!data) return

      setSelection(null)
      setTab('trace')
      setSideOpen(true)
      setRouteStart(String(created[0].id))
      setRouteEnd(String(created[3].id))
      setFitNonce((current) => current + 1)
      notify('success', 'Sample network created')
      pushEvent(
        'success',
        `Sample network created · ${created.length} devices, ${pairs.length} links`,
      )
      await performTrace(created[0].id, created[3].id)
    } catch (requestError) {
      notify('error', requestError.message)
      pushEvent('error', `Sample setup failed: ${requestError.message}`)
      await refreshTopology()
    } finally {
      reserved.forEach((identity) => {
        reservedIds.current.delete(identity.id)
        reservedIps.current.delete(identity.ip)
      })
      setSeeding(false)
    }
  }, [
    allocateIdentity,
    devices,
    notify,
    performTrace,
    pushEvent,
    refreshTopology,
    seeding,
  ])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Persisting is optional; the toggle still works for this session.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0c0e' : '#f5f5f2')
  }, [theme])

  useEffect(() => {
    document.title = devices.length
      ? `netmap · ${devices.length} nodes`
      : 'netmap · topology studio'
  }, [devices.length])

  const pendingSource = pendingLink
    ? devices.find((device) => device.id === pendingLink.source)
    : null
  const pendingTarget = pendingLink
    ? devices.find((device) => device.id === pendingLink.target)
    : null

  return (
    <div className="studio-app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <Logo size={20} />
          </span>
          <div className="brand-copy">
            <span className="brand-name">netmap</span>
            <span className="brand-tag">topology studio</span>
          </div>
        </div>

        <div className="header-stats" aria-label="Topology summary">
          <span>
            <strong>{devices.length}</strong> nodes
          </span>
          <span className="header-stat-sep" aria-hidden="true" />
          <span>
            <strong>{links.length}</strong> links
          </span>
        </div>

        <div className={`api-pill ${statusClass}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm header-trace"
          onClick={() => {
            setTab('trace')
            setSideOpen(true)
          }}
        >
          <Route size={14} />
          <span className="header-trace-label">Trace</span>
        </button>

        <button
          type="button"
          className="icon-btn theme-toggle"
          onClick={() =>
            setTheme((current) => (current === 'light' ? 'dark' : 'light'))
          }
          title={
            theme === 'light'
              ? 'Switch to dark mode'
              : 'Switch to light mode'
          }
          aria-label={
            theme === 'light'
              ? 'Switch to dark mode'
              : 'Switch to light mode'
          }
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          title="Refresh topology"
          aria-label="Refresh topology"
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
        </button>

        <button
          type="button"
          className="icon-btn panel-toggle"
          onClick={() => setSideOpen((current) => !current)}
          aria-expanded={sideOpen}
          aria-controls="studio-panel"
          aria-label="Toggle studio panel"
        >
          <PanelRight size={16} />
        </button>
      </header>

      <div className="studio">
        <div className="canvas-area">
          <ReactFlowProvider>
            <TopologyCanvas
              devices={devices}
              links={links}
              positions={resolvedPositions}
              selection={selection}
              route={route}
              loading={loading}
              refreshing={refreshing}
              error={error}
              seeding={seeding}
              fitNonce={fitNonce}
              onCreateDevice={handleCreateDevice}
              onMoveNode={handleMoveNode}
              onSaveNode={handleSaveNode}
              onSelect={handleCanvasSelect}
              onRequestLink={handleRequestLink}
              onAutoLayout={handleAutoLayout}
              onLoadSample={handleLoadSample}
              onRetry={handleRetry}
              onClearRoute={handleClearRoute}
              onReplayRoute={handleReplayRoute}
            />
          </ReactFlowProvider>
        </div>

        {sideOpen && (
          <button
            type="button"
            className="panel-backdrop"
            onClick={() => setSideOpen(false)}
            aria-label="Close studio panel"
          />
        )}

        <SidePanel
          open={sideOpen}
          tab={tab}
          onTabChange={(nextTab) => {
            setTab(nextTab)
            setSideOpen(true)
          }}
          onClose={() => setSideOpen(false)}
          devices={devices}
          links={links}
          selection={selection}
          onSelect={handlePanelSelect}
          onSetSource={handleSetSource}
          onSetTarget={handleSetTarget}
          onTraceLink={handleTraceLink}
          onCopyIp={handleCopyIp}
          onDeleteDevice={handleRequestDeleteDevice}
          onDeleteLink={handleRequestDeleteLink}
          route={route}
          source={routeSource}
          destination={routeDestination}
          onSourceChange={handleSourceChange}
          onDestinationChange={handleDestinationChange}
          onSwap={handleSwap}
          onTrace={handleTrace}
          onClearRoute={handleClearRoute}
          onReplayRoute={handleReplayRoute}
          onSelectRouteDevice={handleRouteDevice}
          routeError={routeError}
          tracing={tracing}
          events={events}
          onClearEvents={handleClearEvents}
        />
      </div>

      {pendingLink && pendingSource && pendingTarget && (
        <LinkDialog
          sourceDevice={pendingSource}
          targetDevice={pendingTarget}
          onCancel={() => setPendingLink(null)}
          onConfirm={handleConfirmLink}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={
            pendingDelete.kind === 'device'
              ? `Delete device #${pendingDelete.id}?`
              : `Delete link ${pendingDelete.source} → ${pendingDelete.target}?`
          }
          message={
            pendingDelete.kind === 'device'
              ? `Device #${pendingDelete.id} and every link connected to it will be removed. This cannot be undone.`
              : `The one-way link ${pendingDelete.source} → ${pendingDelete.target} will be removed. Any route that depends on it will need to be traced again.`
          }
          confirmLabel={
            pendingDelete.kind === 'device' ? 'Delete device' : 'Delete link'
          }
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="toast-stack" aria-live="polite">
        {notices.map((notice) => {
          const Icon = TOAST_ICONS[notice.tone] ?? Info
          return (
            <div key={notice.id} className={`toast is-${notice.tone}`}>
              <Icon size={15} className="toast-icon" />
              <span>{notice.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
