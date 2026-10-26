#include "Network.h"

void Network::addDevice(const Device &device)
{
    devices.emplace(device.getId(), device); // if id exists dont overwrite
    adjacencyList[device.getId()];
}
void Network::addConnection(int sourceId, int destinationId, int cost)
{
    for (const Connection &existing : adjacencyList[sourceId])
    {
        if (existing.getDestinationId() == destinationId)
            return;
    }
    adjacencyList[sourceId].emplace_back(destinationId, cost);
}

Device *Network::getDevice(int id)
{
    auto it = devices.find(id);
    if (it == devices.end())
        return nullptr;
    return &it->second;
}
std::vector<Connection> Network::getConnections(int id) const
{
    auto it = adjacencyList.find(id);
    if (it == adjacencyList.end())
        return {};
    return it->second;
}
std::vector<Device> Network::getAllDevices() const
{
    std::vector<Device> result;
    for (const auto &pair : devices)
        result.push_back(pair.second);
    return result;
}
