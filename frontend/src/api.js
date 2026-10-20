const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the API. Is the Flask server running?', 0)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // Some responses may not include a JSON body.
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.request ||
      data?.device ||
      data?.ip ||
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return data
}

export const api = {
  getDevices: () => request('/device/'),
  addDevice: ({ id, type, ip }) =>
    request('/device/add', { method: 'POST', body: { id, type, ip } }),
  deleteDevice: (id) =>
    request(`/device/${id}`, { method: 'DELETE' }),
  getConnections: (id) => request(`/connection/${id}`, { method: 'POST' }),
  addConnection: ({ source, destination, cost }) =>
    request('/connection/', {
      method: 'POST',
      body: { source, destination, cost },
    }),
  deleteConnection: (source, destination) =>
    request(`/connection/${source}/${destination}`, { method: 'DELETE' }),
  findRoute: (source, destination) =>
    request('/routing/bfs', {
      method: 'POST',
      body: { source, destination },
    }),
}

export function normalizeType(type) {
  const name = String(type ?? '').split('.').pop()
  return name === 'Switch' ? 'Switch' : 'Computer'
}

/**
 * Loads the whole topology: every device plus every directed link.
 * The backend exposes connections per device, so this fans out one
 * request per device and flattens the results into a graph.
 */
export async function fetchTopology() {
  const data = await api.getDevices()
  const devices = (data?.devices ?? [])
    .map((device) => ({ ...device, type: normalizeType(device.type) }))
    .sort((a, b) => a.id - b.id)

  const connectionLists = await Promise.all(
    devices.map(async (device) => {
      const payload = await api.getConnections(device.id)
      return { source: device.id, connections: payload?.connections ?? [] }
    }),
  )

  const ids = new Set(devices.map((device) => device.id))
  const links = connectionLists
    .flatMap(({ source, connections }) =>
      connections
        .filter((connection) => ids.has(connection.destination))
        .map((connection) => ({
          id: `${source}-${connection.destination}`,
          source,
          target: connection.destination,
          cost: connection.cost,
        })),
    )
    .sort((a, b) => a.source - b.source || a.target - b.target)

  return { devices, links }
}
