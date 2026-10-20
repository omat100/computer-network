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

Device *Network::getDevice(int id) const
{
    auto it = devices.find(id);
    if (it == devices.end())
        return nullptr;
    return it->second;
}
std::vector<Connection *> Network::getConnections(int id) const
{
    auto it = adjacencyList.find(id);
    if (it == adjacencyList.end())
        return {};
    return it->second;
}