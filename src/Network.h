#pragma once
#include <unordered_map>
#include <vector>
#include "Device.h"
#include "Connection.h"

class Network
{
private:
    std::unordered_map<int, Device> devices;
    std::unordered_map<int, std::vector<Connection *>> adjacencyList;

public:
    void addDevice(Device *device);
    void addConnection(int sourceId, int destinationId, int cost);
    Device *getDevice(int id);
    std::vector<Connection *> getConnections(int id);
};