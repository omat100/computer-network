// test_main.cpp
#include <iostream>
#include <vector>
#include "connections/Network.h"
#include "routing/Dijkstra.h"

static void printPath(const std::vector<int> &path)
{
    if (path.empty())
    {
        std::cout << "(no path)\n";
        return;
    }
    for (size_t i = 0; i < path.size(); ++i)
        std::cout << path[i] << (i + 1 < path.size() ? " -> " : "\n");
}

int main()
{
    Network network;

    // Same graph as your screenshot: 1 = Switch 1, 2 = Computer 2, 3 = Computer 3
    // Added in both directions so it's undirected
    network.addConnection(1, 2, 1);
    network.addConnection(2, 1, 1);
    network.addConnection(2, 3, 2);
    network.addConnection(3, 2, 2);
    network.addConnection(1, 3, 5);
    network.addConnection(3, 1, 5);

    Dijkstra dijkstra;

    std::cout << "1 to 3 (expect 1 -> 2 -> 3): ";
    printPath(dijkstra.findPath(network, 1, 3));

    std::cout << "3 to 1 (expect 3 -> 2 -> 1): ";
    printPath(dijkstra.findPath(network, 3, 1));

    std::cout << "1 to 1 (expect 1): ";
    printPath(dijkstra.findPath(network, 1, 1));

    std::cout << "1 to 99 (expect no path): ";
    printPath(dijkstra.findPath(network, 1, 99));

    return 0;
}