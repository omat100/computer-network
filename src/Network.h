#pragma once
#include <unordered_map>
#include <vector>
#include "Device.h"
#include "Connection.h"

class Network
{
private:
    std::unordered_map<int, Device> devices;
    std::unordered_map<int, std::vector<Connection>> adjacencyList;
};