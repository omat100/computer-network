cmake_minimum_required(VERSION 3.16)
project(NetworkProject LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Python REQUIRED COMPONENTS Interpreter Development.Module)
find_package(pybind11 CONFIG REQUIRED)

pybind11_add_module(network_engine
    src/bindings.cpp
    src/connections/Network.cpp
    src/routing/BFS.cpp
    src/routing/Dijkstra.cpp
)

target_include_directories(network_engine PRIVATE
    src/connections
    src/routing
)
