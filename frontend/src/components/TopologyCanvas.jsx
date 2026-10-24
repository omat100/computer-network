import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react'
import {
  AlertTriangle,
  Boxes,
  Cable,
  Loader2,
  Monitor,
  Network,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'
import DeviceNode from './DeviceNode'
import LinkEdge from './LinkEdge'
import Palette from './Palette'
import { DEVICE_MIME, NODE_HEIGHT, NODE_WIDTH } from '../topology/constants'

const NODE_TYPES = { device: DeviceNode }
const EDGE_TYPES = { link: LinkEdge }

function EmptyBoard({ onCreate, onLoadSample, seeding }) {
  return (
    <div className="canvas-empty">
      <span className="empty-mark" aria-hidden="true">
        <Network size={24} strokeWidth={1.7} />
      </span>
      <p className="eyebrow">Your network is empty</p>
      <h2>Start with a device</h2>
      <p className="empty-copy">
        Add computers and switches, then connect them to see how your network works.
      </p>
      <div className="empty-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onCreate('Computer')}
          disabled={seeding}
        >
          <Monitor size={14} />
          Add computer
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onCreate('Switch')}
          disabled={seeding}
        >
          <Network size={14} />
          Add switch
        </button>
      </div>
      <button
        type="button"
        className="btn btn-quiet empty-sample"
        onClick={onLoadSample}
        disabled={seeding}
      >
        {seeding ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
        {seeding ? 'Building sample…' : 'Try a sample network'}
      </button>
      <p className="empty-tip">
        Tip: connect two devices by dragging from one port to another.
      </p>
    </div>
  )
}

export default function TopologyCanvas({
  devices,
  links,
  positions,
  selection,
  route,
  loading,
  refreshing,
  error,
  seeding,
  fitNonce,
  onCreateDevice,
  onMoveNode,
  onSaveNode,
  onSelect,
  onRequestLink,
  onAutoLayout,
  onLoadSample,
  onRetry,
  onClearRoute,
  onReplayRoute,
}) {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const wrapperRef = useRef(null)
  const didInitialFit = useRef(false)
  const previousFitNonce = useRef(fitNonce)
  const [draggingType, setDraggingType] = useState(null)

  useEffect(() => {
    if (
      didInitialFit.current ||
      loading ||
      error ||
      devices.length === 0
    ) {
      return undefined
    }

    didInitialFit.current = true
    const timer = window.setTimeout(
      () => fitView({ padding: 0.24, duration: 550, maxZoom: 1.2 }),
      80,
    )
    return () => window.clearTimeout(timer)
  }, [devices.length, error, fitView, loading])

  useEffect(() => {
    if (previousFitNonce.current === fitNonce) return undefined
    previousFitNonce.current = fitNonce
    const timer = window.setTimeout(
      () => fitView({ padding: 0.2, duration: 450, maxZoom: 1.2 }),
      90,
    )
    return () => window.clearTimeout(timer)
  }, [fitNonce, fitView])

  const routeMap = useMemo(() => {
    const map = new Map()
    if (route?.path?.length) {
      for (let index = 0; index < route.path.length - 1; index += 1) {
        map.set(`${route.path[index]}-${route.path[index + 1]}`, index)
      }
    }
    return map
  }, [route])

  const nodes = useMemo(
    () =>
      devices.map((device) => {
        let routeState = null
        if (route?.path?.includes(device.id)) {
          if (route.path.length > 1 && route.path[0] === device.id) {
            routeState = 'source'
          } else if (
            route.path.length > 1 &&
            route.path[route.path.length - 1] === device.id
          ) {
            routeState = 'target'
          } else {
            routeState = 'path'
          }
        }

        return {
          id: String(device.id),
          type: 'device',
          position: positions[device.id] ?? { x: 0, y: 0 },
          data: { device, routeState },
          measured: { width: NODE_WIDTH, height: NODE_HEIGHT },
          selected: selection?.kind === 'device' && selection.id === device.id,
          draggable: true,
          connectable: true,
        }
      }),
    [devices, positions, route, selection],
  )

  const edges = useMemo(
    () =>
      links.map((link) => {
        const routeIndex = routeMap.get(link.id)
        const active = routeIndex !== undefined
        const selected = selection?.kind === 'link' && selection.id === link.id

        return {
          id: link.id,
          source: String(link.source),
          target: String(link.target),
          type: 'link',
          data: {
            link,
            routeIndex: active ? routeIndex : -1,
            packetKey: route?.key ?? 0,
          },
          selected,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: active
              ? '#22c55e'
              : selected
                ? '#6579df'
                : '#8d96a3',
          },
          interactionWidth: 24,
        }
      }),
    [links, route, routeMap, selection],
  )

  const handleNodesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          onMoveNode(Number(change.id), change.position)
        }
      })
    },
    [onMoveNode],
  )

  const handleNodeClick = useCallback(
    (_, node) => onSelect({ kind: 'device', id: Number(node.id) }),
    [onSelect],
  )

  const handleEdgeClick = useCallback(
    (_, edge) => onSelect({ kind: 'link', id: edge.id }),
    [onSelect],
  )

  const handlePaneClick = useCallback(() => onSelect(null), [onSelect])

  const handleConnect = useCallback(
    (connection) =>
      onRequestLink(Number(connection.source), Number(connection.target)),
    [onRequestLink],
  )

  const addAtCenter = useCallback(
    (type) => {
      const bounds = wrapperRef.current?.getBoundingClientRect()
      if (!bounds) return

      const point = screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      })
      const offset = (devices.length % 4) * 14

      onCreateDevice(type, {
        x: point.x - NODE_WIDTH / 2 + offset,
        y: point.y - NODE_HEIGHT / 2 + offset,
      })
    },
    [devices.length, onCreateDevice, screenToFlowPosition],
  )

  function handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(event) {
    event.preventDefault()
    const type = event.dataTransfer.getData(DEVICE_MIME)
    setDraggingType(null)

    if (type !== 'Computer' && type !== 'Switch') return

    const point = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    onCreateDevice(type, {
      x: point.x - NODE_WIDTH / 2,
      y: point.y - NODE_HEIGHT / 2,
    })
  }

  const hops = route?.path?.length ? route.path.length - 1 : 0
  const paletteDisabled = loading || Boolean(error) || seeding

  return (
    <div className="topology-workspace">
      <aside className="tool-sidebar" aria-label="Device palette">
        <div className="tool-sidebar-head">
          <p className="eyebrow">Add to your map</p>
          <h2>Devices</h2>
          <p>Click a device to add it to the canvas.</p>
        </div>
        <Palette
          disabled={paletteDisabled}
          onAdd={addAtCenter}
          onDragStartType={setDraggingType}
          onDragEnd={() => setDraggingType(null)}
          onAutoLayout={onAutoLayout}
          onFitView={() =>
            fitView({ padding: 0.22, duration: 450, maxZoom: 1.2 })
          }
        />
      </aside>

      <div
        ref={wrapperRef}
        className={`canvas-shell ${draggingType ? 'is-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={handleNodesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          onNodeDragStop={(_, node) => onSaveNode(Number(node.id), node.position)}
          onConnect={handleConnect}
          connectionLineType={ConnectionLineType.Bezier}
          connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2 }}
          connectionRadius={28}
          minZoom={0.22}
          maxZoom={2.3}
          panOnScroll={false}
          nodesDraggable={!loading}
          nodesConnectable={!loading && !error}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          proOptions={{ hideAttribution: true }}
          fitViewOptions={{ padding: 0.24 }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.15}
            color="var(--grid-dot)"
          />
          <Controls position="top-right" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(node) =>
              node.data?.device?.type === 'Switch' ? 'var(--switch)' : 'var(--accent)'
            }
            nodeStrokeWidth={0}
            maskColor="var(--minimap-mask)"
            style={{ width: 150, height: 96 }}
          />

          <Panel position="bottom-left" className="canvas-status">
            <span>
              <Boxes size={13} />
              {devices.length} {devices.length === 1 ? 'node' : 'nodes'}
            </span>
            <span>
              <Cable size={13} />
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </span>
            <span className="status-hint">Drag to pan · Scroll to zoom</span>
          </Panel>

          {route && (
            <Panel
              position="bottom-center"
              className={`route-banner ${route.path.length ? '' : 'is-empty'}`}
            >
              <span className="route-banner-dot" aria-hidden="true" />
              <span className="route-banner-label">
                {route.path.length ? 'Route' : 'No route'}
              </span>
              <strong>
                {route.source} → {route.destination}
              </strong>
              {hops > 0 && (
                <span className="route-banner-meta">
                  {hops} {hops === 1 ? 'hop' : 'hops'}
                </span>
              )}
              {hops > 0 && (
                <button
                  type="button"
                  className="route-banner-btn"
                  onClick={onReplayRoute}
                  title="Replay packet"
                  aria-label="Replay packet"
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <button
                type="button"
                className="route-banner-btn"
                onClick={onClearRoute}
                title="Clear route"
                aria-label="Clear route"
              >
                <X size={13} />
              </button>
            </Panel>
          )}

          {refreshing && !loading && (
            <Panel position="top-center" className="sync-pill">
              <Loader2 size={12} className="spin" />
              Syncing topology
            </Panel>
          )}
        </ReactFlow>

        {loading && (
          <div className="canvas-overlay">
            <Loader2 size={20} className="spin" />
            <p>Syncing topology…</p>
          </div>
        )}

        {!loading && error && (
          <div className="canvas-overlay is-error">
            <span className="overlay-icon is-error" aria-hidden="true">
              <AlertTriangle size={20} />
            </span>
            <h2>Cannot reach the engine</h2>
            <p>{error}</p>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Retry connection
            </button>
          </div>
        )}

        {!loading && !error && devices.length === 0 && (
          <EmptyBoard
            onCreate={addAtCenter}
            onLoadSample={onLoadSample}
            seeding={seeding}
          />
        )}

        {draggingType && (
          <div className="drop-overlay" aria-hidden="true">
            <span className="drop-overlay-icon">
              {draggingType === 'Switch' ? (
                <Network size={20} />
              ) : (
                <Monitor size={20} />
              )}
            </span>
            Drop to add {draggingType.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  )
}
