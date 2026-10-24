#include "BFS.h"
#include <queue>
#include <unordered_set>
#include <unordered_map>
#include <algorithm>

std::vector<int> BFS::findPath(const Network &network, int sourceId, int destinationId)
{
    std::queue<int> q;
    std::unordered_set<int> visited;
    std::unordered_map<int, int> parent;
    std::vector<int> path;
    if (sourceId == destinationId)
        return {sourceId};
    visited.insert(sourceId);
    q.push(sourceId);
    bool finding = true;
    while (!q.empty() && finding)
    {
        int currentId = q.front();
        q.pop();
        for (Connection *comp : network.getConnections(currentId))
        {
            if (visited.count(comp->getDestinationId()))
                continue;
            visited.insert(comp->getDestinationId());

            parent[comp->getDestinationId()] = currentId;
            q.push(comp->getDestinationId());
            if (comp->getDestinationId() == destinationId)
            {
                finding = false;
                break;
            }
        }
    }
    if (finding)
        return {};
    int current = destinationId;
    while (current != sourceId)
    {
        path.push_back(current);
        current = parent[current];
    }
    path.push_back(sourceId);
    std::reverse(path.begin(), path.end());
    return path;
}