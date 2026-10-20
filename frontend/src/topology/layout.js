import { NODE_HEIGHT, NODE_WIDTH, POSITIONS_KEY } from './constants'

function centered(x, y) {
  return {
    x: Math.round(x - NODE_WIDTH / 2),
    y: Math.round(y - NODE_HEIGHT / 2),
  }
}

/**
 * A deliberately simple layout: an ellipse for small networks and a
 * four-column grid for larger ones. Positions are flow coordinates.
 */
export function autoLayout(devices) {
  const result = {}
  const count = devices.length
  if (count === 0) return result
  if (count === 1) {
    result[devices[0].id] = { x: 0, y: 0 }
    return result
  }

  if (count <= 8) {
    const radiusX = Math.max(270, count * 54)
    const radiusY = Math.max(160, count * 36)

    devices.forEach((device, index) => {
      const angle = (index / count) * Math.PI * 2
      result[device.id] = centered(
        Math.cos(angle) * radiusX,
        Math.sin(angle) * radiusY,
      )
    })
    return result
  }

  const columns = 4
  devices.forEach((device, index) => {
    result[device.id] = {
      x: (index % columns) * 260,
      y: Math.floor(index / columns) * 180,
    }
  })
  return result
}

/**
 * Merges stored positions with the current device list. Devices without a
 * stored position get a deterministic auto layout; new devices added later
 * are placed to the right of the existing map.
 */
export function resolvePositions(devices, stored) {
  const missing = devices.filter((device) => !stored[device.id])
  if (missing.length === 0) return stored
  if (missing.length === devices.length) return autoLayout(devices)

  const result = {}
  devices.forEach((device) => {
    if (stored[device.id]) result[device.id] = stored[device.id]
  })

  const placed = Object.values(result)
  const startX = placed.length
    ? Math.max(...placed.map((position) => position.x)) + 260
    : 0
  const startY = placed.length
    ? Math.min(...placed.map((position) => position.y))
    : 0

  missing.forEach((device, index) => {
    result[device.id] = {
      x: startX + Math.floor(index / 3) * 260,
      y: startY + (index % 3) * 170,
    }
  })

  return result
}

export function loadStoredPositions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(POSITIONS_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object') return {}

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, position]) =>
          Number.isFinite(position?.x) && Number.isFinite(position?.y),
      ),
    )
  } catch {
    return {}
  }
}

export function persistPositions(positions) {
  try {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
  } catch {
    // Storage can be unavailable (private mode); the UI keeps working.
  }
}
