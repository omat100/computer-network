#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

#include "Device.h"
#include "Connection.h"
#include "Network.h"
#include "BFS.h"
#include "Dijkstra.h"
namespace py = pybind11;

PYBIND11_MODULE(network_engine, m)
{
    m.doc() = "C++ network and pathfinding engine";

    py::enum_<Device::DeviceType>(m, "DeviceType")
        .value("Computer", Device::Computer)
        .value("Switch", Device::Switch);

    py::class_<Device>(m, "Device")
        .def(py::init<int, Device::DeviceType, std::string>())
        .def("getId", &Device::getId)
        .def("getType", &Device::getType)
        .def("getIpAddress", &Device::getIpAddress);

    py::class_<Connection>(m, "Connection")
        .def(py::init<int, int>())
        .def("getDestinationId", &Connection::getDestinationId)
        .def("getCost", &Connection::getCost);

    py::class_<Network>(m, "Network")
        .def(py::init<>())
        .def("addDevice", &Network::addDevice)
        .def("addConnection", &Network::addConnection)
        .def("getDevice", &Network::getDevice,
             py::return_value_policy::reference_internal)
        .def("getConnections", &Network::getConnections)
        .def("getAllDevices", &Network::getAllDevices);

    py::class_<BFS>(m, "BFS")
        .def(py::init<>())
        .def("findPath", &BFS::findPath);

    py::class_<Dijkstra>(m, "Dijkstra")
        .def(py::init<>())
        .def("findPath", &Dijkstra::findPath);
}
