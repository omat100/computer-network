#pragma once
#include <string>
class Device
{
public:
    enum DeviceType
    {
        Computer = 0,
        Switch = 1
    };

private:
    int id;
    DeviceType type;
    std::string ipAddress;

public:
    Device(int id, DeviceType type, std::string ipAddress)
        : id(id), type(type), ipAddress(ipAddress) {}
    int getId() const { return id; }
    DeviceType getType() const { return type; }
    std::string getIpAddress() const { return ipAddress; }
};