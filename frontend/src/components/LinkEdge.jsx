import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'

const PACKET_DURATION = 0.72

function LinkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected,
}) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  })

  const active = data.routeIndex >= 0
  const delay = active ? data.routeIndex * PACKET_DURATION : 0

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={22}
        className={[
          'link-edge',
          active ? 'is-active' : '',
          selected ? 'is-selected' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {active && (
        <circle
          key={`${id}-packet-${data.packetKey}`}
          r="4.5"
          className="link-packet"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0;1;1;0;0"
            keyTimes="0;0.001;0.04;0.82;0.96;1"
            dur={`${PACKET_DURATION}s`}
            begin={`${delay}s`}
            fill="freeze"
          />
          <animateMotion
            dur={`${PACKET_DURATION}s`}
            begin={`${delay}s`}
            fill="freeze"
            path={path}
          />
        </circle>
      )}

      <EdgeLabelRenderer>
        <span
          className={[
            'link-cost',
            active ? 'is-active' : '',
            selected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {data.link.cost}
        </span>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(LinkEdge)
