cmake_minimum_required(VERSION 3.16)
project(NetworkProject LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(NetworkProject
    src/main.cpp
    src/connections/Network.cpp
    src/routing/BFS.cpp
)

target_include_directories(NetworkProject PRIVATE
    src/connections
    src/routing
)
