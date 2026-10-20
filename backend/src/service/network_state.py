import network_engine


def _device_snapshot(network):
    return [
        {
            "id": device.getId(),
            "type": device.getType(),
            "ip": device.getIpAddress(),
        }
        for device in network.getAllDevices()
    ]


def _connection_snapshot(network):
    return [
        {
            "source": device["id"],
            "destination": connection.getDestinationId(),
            "cost": connection.getCost(),
        }
        for device in _device_snapshot(network)
        for connection in network.getConnections(device["id"])
    ]


class NetworkState:
    """Mutable wrapper around the C++ network engine.

    The engine keeps raw pointers to devices and connections, so removal is
    implemented by rebuilding a fresh engine from a snapshot. This keeps the
    existing C++ extension untouched while still allowing cascading deletes.
    """

    def __init__(self):
        self._network = network_engine.Network()

    def __getattr__(self, name):
        return getattr(self._network, name)

    @property
    def engine(self):
        return self._network

    def _replace(self, devices, connections):
        replacement = network_engine.Network()
        for device in devices:
            replacement.addDevice(
                network_engine.Device(
                    device["id"],
                    device["type"],
                    device["ip"],
                )
            )
        for connection in connections:
            replacement.addConnection(
                connection["source"],
                connection["destination"],
                connection["cost"],
            )
        self._network = replacement

    def delete_device(self, device_id):
        if self._network.getDevice(device_id) is None:
            return False

        devices = [
            device
            for device in _device_snapshot(self._network)
            if device["id"] != device_id
        ]
        connections = [
            connection
            for connection in _connection_snapshot(self._network)
            if connection["source"] != device_id
            and connection["destination"] != device_id
        ]
        self._replace(devices, connections)
        return True

    def delete_connection(self, source, destination):
        if self._network.getDevice(source) is None:
            return False

        connections = _connection_snapshot(self._network)
        if not any(
            connection["source"] == source
            and connection["destination"] == destination
            for connection in connections
        ):
            return False

        self._replace(
            _device_snapshot(self._network),
            [
                connection
                for connection in connections
                if not (
                    connection["source"] == source
                    and connection["destination"] == destination
                )
            ],
        )
        return True


NETWORK = NetworkState()
BFS = network_engine.BFS()
