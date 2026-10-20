import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Monitor, Network } from 'lucide-react'

function DeviceNode({ data, selected }) {
  const { device, routeState } = data
  const isSwitch = device.type === 'Switch'
  const Icon = isSwitch ? Network : Monitor

  return (
    <div
      className={[
        'device-node',
        isSwitch ? 'is-switch' : 'is-computer',
        selected ? 'is-selected' : '',
        routeState ? `route-${routeState}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="device-port is-target"
        title="Incoming link port"
      />

      <span className="device-avatar" aria-hidden="true">
        <Icon size={19} strokeWidth={1.8} />
      </span>

      <span className="device-copy">
        <span className="device-name-row">
          <span className="device-name">Device {device.id}</span>
          {routeState === 'source' && <span className="route-badge">src</span>}
          {routeState === 'target' && <span className="route-badge">dst</span>}
        </span>
        <span className="device-kind">{isSwitch ? 'Switch' : 'Computer'}</span>
        <span className="device-ip">{device.ip}</span>
      </span>

      <Handle
        type="source"
        position={Position.Right}
        className="device-port is-source"
        title="Drag to create a link"
      />
    </div>
  )
}

export default memo(DeviceNode)
