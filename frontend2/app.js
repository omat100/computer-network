const API_BASE = window.NETWORK_API_BASE || 'https://computer-network-br15.onrender.com/api'

const network = document.querySelector('#network')
const deviceCount = document.querySelector('#deviceCount')
const reloadButton = document.querySelector('#resetButton')
const apiStatus = document.querySelector('#apiStatus')
const sourceSelect = document.querySelector('#sourceSelect')
const targetSelect = document.querySelector('#targetSelect')
const connectButton = document.querySelector('#connectButton')
const connectionMessage = document.querySelector('#connectionMessage')
const connectionCost = document.querySelector('#connectionCost')
const routeSource = document.querySelector('#routeSource')
const routeTarget = document.querySelector('#routeTarget')
const routeButton = document.querySelector('#routeButton')
const routeMessage = document.querySelector('#routeMessage')

let devices = []
let connections = []
let routePath = []
let nextId = 1
let pendingConnectionSource = null

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || data.request || 'The request failed.')
  return data
}

function setApiStatus(online, text) {
  apiStatus.classList.toggle('is-error', !online)
  apiStatus.innerHTML = `<span></span> ${text}`
}

function typeOf(device) {
  return String(device.type).split('.').pop() === 'Switch' ? 'Switch' : 'Computer'
}

function nameOf(device) { return `${typeOf(device)} ${device.id}` }

function getCost() {
  const value = Number(connectionCost.value)
  return Number.isFinite(value) && value >= 1 ? value : 1
}

function positions() {
  try { return JSON.parse(localStorage.getItem('frontend2.positions') || '{}') } catch { return {} }
}

function savePositions() {
  localStorage.setItem('frontend2.positions', JSON.stringify(
    Object.fromEntries(devices.map((device) => [device.id, { x: device.x, y: device.y }])),
  ))
}

function updateSelects() {
  const options = devices.length
    ? devices.map((device) => `<option value="${device.id}">${nameOf(device)}</option>`).join('')
    : '<option value="">No devices</option>'
  ;[sourceSelect, targetSelect, routeSource, routeTarget].forEach((select) => {
    const previous = select.value
    select.innerHTML = options
    if (devices.some((device) => String(device.id) === previous)) select.value = previous
  })
  connectButton.disabled = devices.length < 2
  routeButton.disabled = devices.length < 2
}

function onRoute(connection) {
  return routePath.some((id, index) => id === connection.source && routePath[index + 1] === connection.target)
}

function drawConnections() {
  const svg = network.querySelector('.connections')
  if (!svg) return
  svg.innerHTML = connections.map((connection) => {
    const source = network.querySelector(`[data-id="${connection.source}"]`)
    const target = network.querySelector(`[data-id="${connection.target}"]`)
    if (!source || !target) return ''
    const active = onRoute(connection) ? ' route' : ''
    const x1 = source.offsetLeft + source.offsetWidth / 2
    const y1 = source.offsetTop + source.offsetHeight / 2
    const x2 = target.offsetLeft + target.offsetWidth / 2
    const y2 = target.offsetTop + target.offsetHeight / 2
    return `<line class="${active}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle">${connection.cost ?? 1}</text>`
  }).join('')
}

function place(element, device) {
  const maxX = Math.max(8, network.clientWidth - element.offsetWidth - 8)
  const maxY = Math.max(8, network.clientHeight - element.offsetHeight - 8)
  element.style.left = `${Math.max(8, Math.min(device.x ?? 24, maxX))}px`
  element.style.top = `${Math.max(8, Math.min(device.y ?? 24, maxY))}px`
}

function drawNetwork() {
  deviceCount.textContent = `${devices.length} ${devices.length === 1 ? 'device' : 'devices'} · ${connections.length} ${connections.length === 1 ? 'connection' : 'connections'}`
  updateSelects()
  if (!devices.length) {
    network.innerHTML = '<p class="empty">No devices yet. Add one from the left.</p>'
    return
  }

  const routeLabel = routePath.length > 1 ? `<div class="route-label">Route: ${routePath.join(' → ')}</div>` : ''
  network.innerHTML = `<svg class="connections" aria-hidden="true"></svg>${routeLabel}` + devices.map((device) => {
    const icon = typeOf(device) === 'Switch' ? '◆' : '▣'
    const className = typeOf(device) === 'Switch' ? 'network-device switch' : 'network-device'
    return `<div class="${className}" draggable="true" data-id="${device.id}"><button type="button" class="connect-port port-left" data-connect-target="${device.id}" aria-label="Connection input"></button><button type="button" draggable="false" class="connect-port port-right" data-connect-source="${device.id}" aria-label="Connection output"></button><button type="button" class="delete-device" aria-label="Delete ${nameOf(device)}">×</button><span class="device-icon">${icon}</span><strong>${nameOf(device)}</strong><small>${device.ip || 'No IP'}</small></div>`
  }).join('')

  devices.forEach((device) => {
    const element = network.querySelector(`[data-id="${device.id}"]`)
    place(element, device)
    element.addEventListener('dragstart', (event) => {
      if (event.target.closest('.connect-port')) return
      event.dataTransfer.setData('text/device-id', String(device.id))
      event.dataTransfer.effectAllowed = 'move'
    })

    element.querySelectorAll('.connect-port').forEach((port) => {
      port.addEventListener('pointerdown', (event) => {
        event.preventDefault()
        event.stopPropagation()
        pendingConnectionSource = device.id
        network.classList.add('is-connecting')
      })
    })
    element.querySelector('.delete-device').addEventListener('click', async (event) => {
      event.stopPropagation()
      try { await request(`/device/${device.id}`, { method: 'DELETE' }); await loadNetwork() }
      catch (error) { routeMessage.textContent = error.message }
    })
  })
  drawConnections()
}

async function loadNetwork() {
  try {
    const saved = positions()
    const data = await request('/device/')
    devices = (data.devices || []).map((device) => ({
      ...device, type: typeOf(device), x: saved[device.id]?.x, y: saved[device.id]?.y,
    }))
    const lists = await Promise.all(devices.map(async (device) => {
      const dataForDevice = await request(`/connection/${device.id}`, { method: 'POST' })
      return (dataForDevice.connections || []).map((connection) => ({
        source: device.id, target: connection.destination, cost: connection.cost,
      }))
    }))
    connections = lists.flat()
    nextId = Math.max(0, ...devices.map((device) => Number(device.id))) + 1
    routePath = []
    setApiStatus(true, 'Backend connected')
    drawNetwork()
  } catch (error) {
    devices = []
    connections = []
    drawNetwork()
    setApiStatus(false, 'Backend unavailable')
    routeMessage.textContent = `${error.message} Start Flask or check the API URL.`
  }
}

function newIp() {
  const used = new Set(devices.map((device) => device.ip))
  let host = 1
  while (used.has(`192.168.1.${host}`)) host += 1
  return `192.168.1.${host}`
}

async function addDevice(type, x = 24, y = 24) {
  const id = nextId
  const ip = newIp()
  await request('/device/add', { method: 'POST', body: { id, type, ip } })
  nextId += 1
  devices.push({ id, type, ip, x, y })
  savePositions()
  drawNetwork()
}

document.querySelectorAll('[data-device]').forEach((button) => {
  button.addEventListener('click', async () => {
    try { await addDevice(button.dataset.device) } catch (error) { connectionMessage.textContent = error.message }
  })
  button.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/device-type', button.dataset.device)
    event.dataTransfer.setData('text/plain', button.dataset.device)
    event.dataTransfer.effectAllowed = 'copy'
  })
})

network.addEventListener('dragover', (event) => { event.preventDefault(); network.classList.add('is-over') })
network.addEventListener('dragleave', () => network.classList.remove('is-over'))
network.addEventListener('drop', async (event) => {
  event.preventDefault()
  network.classList.remove('is-over')
  const rect = network.getBoundingClientRect()
  const x = event.clientX - rect.left - 52
  const y = event.clientY - rect.top - 35
  const type = event.dataTransfer.getData('text/device-type') || event.dataTransfer.getData('text/plain')
  const movedId = Number(event.dataTransfer.getData('text/device-id'))
  const sourceId = Number(event.dataTransfer.getData('text/connect-source'))
  const targetElement = event.target.closest?.('[data-id]')
  const targetId = Number(targetElement?.dataset.id)

  if (sourceId) {
    if (!targetId || sourceId === targetId) {
      connectionMessage.textContent = 'Drop the port on a different device.'
      return
    }
    try {
      await request('/connection/', { method: 'POST', body: { source: sourceId, destination: targetId, cost: getCost() } })
      connectionMessage.textContent = 'Connection added by dragging.'
      await loadNetwork()
    } catch (error) { connectionMessage.textContent = error.message }
    return
  }

  if (type) {
    try { await addDevice(type, x, y) } catch (error) { connectionMessage.textContent = error.message }
    return
  }
  const device = devices.find((item) => item.id === movedId)
  if (device) { device.x = x; device.y = y; savePositions(); drawNetwork() }
})

document.addEventListener('pointerup', async (event) => {
  if (!pendingConnectionSource) return
  const sourceId = pendingConnectionSource
  pendingConnectionSource = null
  network.classList.remove('is-connecting')

  const targetElement = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-id]')
  const targetId = Number(targetElement?.dataset.id)
  if (!targetId || sourceId === targetId) {
    connectionMessage.textContent = 'Drop the port on a different device.'
    return
  }

  try {
    await request('/connection/', { method: 'POST', body: { source: sourceId, destination: targetId, cost: 1 } })
    connectionMessage.textContent = 'Connection added by dragging.'
    await loadNetwork()
  } catch (error) { connectionMessage.textContent = error.message }
})

connectButton.addEventListener('click', async () => {
  const source = Number(sourceSelect.value)
  const target = Number(targetSelect.value)
  if (!source || !target || source === target) { connectionMessage.textContent = 'Choose two different devices.'; return }
  try {
    await request('/connection/', { method: 'POST', body: { source, destination: target, cost: getCost() } })
    connectionMessage.textContent = 'Connection added.'
    await loadNetwork()
  } catch (error) { connectionMessage.textContent = error.message }
})

routeButton.addEventListener('click', async () => {
  const source = Number(routeSource.value)
  const target = Number(routeTarget.value)
  if (!source || !target || source === target) { routeMessage.textContent = 'Choose two different devices.'; return }
  try {
    const data = await request('/routing/bfs', { method: 'POST', body: { source, destination: target } })
    routePath = data.path || []
    routeMessage.textContent = routePath.length ? `Found ${routePath.length - 1} hop(s).` : 'No route found.'
    drawNetwork()
  } catch (error) { routeMessage.textContent = error.message }
})

reloadButton.addEventListener('click', loadNetwork)
window.addEventListener('resize', drawConnections)
loadNetwork()
