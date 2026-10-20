#include "Network.h"

void Network::addDevice(Device *device)
{
    if (!device)
        return;
    devices.emplace(device->getId(), device); // if id exists dont overwrite
    adjacencyList[device->getId()];
}
void Network::addConnection(int sourceId, int destinationId, int cost)
{
    Connection *connection = new Connection(destinationId, cost);
    for (Connection *connection : adjacencyList[sourceId])
    {
        if (connection->getDestinationId() == destinationId)
            return;
    }
    adjacencyList[sourceId].push_back(connection);
}