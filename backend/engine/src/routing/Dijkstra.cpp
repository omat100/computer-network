#include "Dijkstra.h"
#include <queue>
#include <vector>
#include <functional>
#include <unordered_map>
#include <algorithm>
#include <utility>

std::vector<int> Dijkstra::findPath(const Network &network, int sourceId, int destinationId)
{
    // {cost so far, node id}, smallest cost on top
    using Entry = std::pair<int, int>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;
    std::unordered_map<int, int> dist;
    std::unordered_map<int, int> parent;
    std::vector<int> path;

    if (sourceId == destinationId)
        return {sourceId};

    dist[sourceId] = 0;
    pq.push({0, sourceId});
    bool found = false;

    while (!pq.empty())
    {
        Entry top = pq.top();
        pq.pop();
        int currentCost = top.first;
        int currentId = top.second;

        // Stop when we POP the destination, that's when its cost is final
        if (currentId == destinationId)
        {
            found = true;
            break;
        }

        // Stale entry, a cheaper route to this node was already processed
        if (currentCost > dist[currentId])
            continue;

        for (const Connection &comp : network.getConnections(currentId))
        {
            int nextId = comp.getDestinationId();
            int newCost = currentCost + comp.getCost();

            auto it = dist.find(nextId);
            if (it == dist.end() || newCost < it->second)
            {
                dist[nextId] = newCost;
                parent[nextId] = currentId;
                pq.push({newCost, nextId});
            }
        }
    }

    if (!found)
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