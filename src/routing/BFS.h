#pragma once
#include "../connections/Network.h"
#include <vector>

class BFS
{
public:
    std::vector<int> findPath(const Network &network, int sourceId, int destinationId);
};