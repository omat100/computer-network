const network = document.querySelector('#network')
const deviceCount = document.querySelector('#deviceCount')
const resetButton = document.querySelector('#resetButton')
const sourceSelect = document.querySelector('#sourceSelect')
const targetSelect = document.querySelector('#targetSelect')
const connectButton = document.querySelector('#connectButton')
const connectionMessage = document.querySelector('#connectionMessage')

const startingDevices = [
  { name: 'Computer 1', type: 'Computer', x: 70, y: 88 },
  { name: 'Switch 1', type: 'Switch', x: 270, y: 88 },
]

let devices = [...startingDevices]
let nextId = 3
let connections = [{ source: 1, target: 2 }]

function addDevice(type, x = null, y = null) {
  const number = devices.filter((device) => device.type === type).length + 1
  devices.push({ id: nextId++, name: `${type} ${number}`, type, x, y })
  drawNetwork()
}

function positionDevice(element, device) {
  const maxX = Math.max(8, network.clientWidth - element.offsetWidth - 8)
  const maxY = Math.max(8, network.clientHeight - element.offsetHeight - 8)
  element.style.left = `${Math.max(8, Math.min(device.x ?? 24, maxX))}px`
  element.style.top = `${Math.max(8, Math.min(device.y ?? 24, maxY))}px`
}

function updateDeviceSelects() {
  const options = devices.length
    ? devices.map((device) => `<option value="${device.id}">${device.name}</option>`).join('')
    : '<option value="">No devices</option>'
  sourceSelect.innerHTML = options
  targetSelect.innerHTML = options
  connectButton.disabled = devices.length < 2
}

function drawConnections() {
  const svg = network.querySelector('.connections')
  if (!svg) return

  svg.innerHTML = connections.map((connection) => {
    const source = network.querySelector(`[data-id="${connection.source}"]`)
    const target = network.querySelector(`[data-id="${connection.target}"]`)
    if (!source || !target) return ''
    return `<line x1="${source.offsetLeft + source.offsetWidth / 2}" y1="${source.offsetTop + source.offsetHeight / 2}" x2="${target.offsetLeft + target.offsetWidth / 2}" y2="${target.offsetTop + target.offsetHeight / 2}"></line>`
  }).join('')
}

function drawNetwork() {
  deviceCount.textContent = `${devices.length} ${devices.length === 1 ? 'device' : 'devices'}`
  updateDeviceSelects()

  if (devices.length === 0) {
    network.innerHTML = '<p class="empty">No devices yet. Add one from the left.</p>'
    return
  }

  network.innerHTML = '<svg class="connections" aria-hidden="true"></svg>' + devices
    .map((device) => {
      const icon = device.type === 'Switch' ? '◆' : '▣'
      const className = device.type === 'Switch' ? 'network-device switch' : 'network-device'
      return `<div class="${className}" draggable="true" data-id="${device.id}"><button class="delete-device" data-delete-id="${device.id}" aria-label="Delete ${device.name}">×</button><span class="device-icon">${icon}</span><strong>${device.name}</strong><small>${device.type}</small></div>`
    })
    .join('')

  devices.forEach((device) => {
    const element = network.querySelector(`[data-id="${device.id}"]`)
    positionDevice(element, device)

    element.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/device-id', String(device.id))
      event.dataTransfer.effectAllowed = 'move'
    })

    element.querySelector('.delete-device').addEventListener('click', (event) => {
      event.stopPropagation()
      devices = devices.filter((item) => item.id !== device.id)
      connections = connections.filter((connection) => connection.source !== device.id && connection.target !== device.id)
      drawNetwork()
    })
  })
  drawConnections()
}

document.querySelectorAll('[data-device]').forEach((button) => {
  button.addEventListener('click', () => {
    addDevice(button.dataset.device)
  })

  button.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/device-type', button.dataset.device)
    event.dataTransfer.effectAllowed = 'copy'
  })
})

network.addEventListener('dragover', (event) => {
  event.preventDefault()
  network.classList.add('is-over')
})

network.addEventListener('dragleave', () => network.classList.remove('is-over'))

network.addEventListener('drop', (event) => {
  event.preventDefault()
  network.classList.remove('is-over')
  const rect = network.getBoundingClientRect()
  const type = event.dataTransfer.getData('text/device-type')
  const movedId = Number(event.dataTransfer.getData('text/device-id'))
  const x = event.clientX - rect.left - 65
  const y = event.clientY - rect.top - 45

  if (type) {
    addDevice(type, x, y)
    return
  }

  const device = devices.find((item) => item.id === movedId)
  if (device) {
    device.x = x
    device.y = y
    drawNetwork()
  }
})

connectButton.addEventListener('click', () => {
  const source = Number(sourceSelect.value)
  const target = Number(targetSelect.value)
  if (!source || !target || source === target) {
    connectionMessage.textContent = 'Choose two different devices.'
    return
  }
  const exists = connections.some((connection) => connection.source === source && connection.target === target)
  if (exists) {
    connectionMessage.textContent = 'Those devices are already connected.'
    return
  }
  connections.push({ source, target })
  connectionMessage.textContent = 'Connection added.'
  drawNetwork()
})

resetButton.addEventListener('click', () => {
  devices = startingDevices.map((device, index) => ({ ...device, id: index + 1 }))
  connections = [{ source: 1, target: 2 }]
  nextId = 3
  drawNetwork()
})

devices = startingDevices.map((device, index) => ({ ...device, id: index + 1 }))
drawNetwork()
