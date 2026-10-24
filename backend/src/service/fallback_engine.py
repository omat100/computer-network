"""Pure-Python fallback for the C++ network_engine extension.

The extension is preferred whenever it has been built. This fallback keeps the
Flask app usable on machines that do not have a C++ toolchain available.
"""

from collections import deque
from enum import Enum


class DeviceType(Enum):
    Computer = 0
    Switch = 1


class Device:
    def __init__(self, device_id, device_type, ip_address):
        self._id = device_id
        self._type = device_type
        self._ip_address = ip_address

    def getId(self):
        return self._id

    def getType(self):
        return self._type

    def getIpAddress(self):
        return self._ip_address


class Connection:
    def __init__(self, destination_id, cost):
        self._destination_id = destination_id
        self._cost = cost

    def getDestinationId(self):
        return self._destination_id

    def getCost(self):
        return self._cost


class Network:
    def __init__(self):
        self._devices = {}
        self._adjacency = {}

    def addDevice(self, device):
        if device is None or device.getId() in self._devices:
            return
        self._devices[device.getId()] = device
        self._adjacency.setdefault(device.getId(), [])

    def addConnection(self, source_id, destination_id, cost):
        connections = self._adjacency.setdefault(source_id, [])
        if any(
            connection.getDestinationId() == destination_id
            for connection in connections
        ):
            return
        connections.append(Connection(destination_id, cost))

    def getDevice(self, device_id):
        return self._devices.get(device_id)

    def getConnections(self, device_id):
        return list(self._adjacency.get(device_id, []))

    def getAllDevices(self):
        return list(self._devices.values())


class BFS:
    def findPath(self, network, source_id, destination_id):
        if source_id == destination_id:
            return [source_id]

        visited = {source_id}
        parents = {}
        queue = deque([source_id])

        while queue:
            current_id = queue.popleft()
            for connection in network.getConnections(current_id):
                next_id = connection.getDestinationId()
                if next_id in visited:
                    continue

                visited.add(next_id)
                parents[next_id] = current_id
                if next_id == destination_id:
                    path = [destination_id]
                    while path[-1] != source_id:
                        path.append(parents[path[-1]])
                    path.reverse()
                    return path

                queue.append(next_id)

        return []
