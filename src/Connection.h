#pragma once

class Connection
{
private:
    int destinationId;
    int cost;

public:
    Connection(int destinationId, int cost)
        : destinationId(destinationId), cost(cost) {}

    int getDestinationId() const { return destinationId; }
    int getCost() const { return cost; }
};