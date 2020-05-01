cmake_minimum_required(VERSION 3.0.0)
project(complex_number VERSION 0.1.0)

if(MSVC)
  # Force to always compile with W4
  if(CMAKE_CXX_FLAGS MATCHES "/W[0-4]")
    string(REGEX REPLACE "/W[0-4]" "/W4" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
  else()
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4")
  endif()
elseif(CMAKE_COMPILER_IS_GNUCC OR CMAKE_COMPILER_IS_GNUCXX)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Werror -Wpedantic -pedantic-errors")
endif()

include(CTest)
enable_testing()

include_directories(include)

file(GLOB TARGET_SRC "src/*.cpp" )
add_executable(main ${TARGET_SRC})

file(GLOB TARGET_SHARED_LIB "lib/*.so" )
link_directories(lib)
target_link_libraries(main ${TARGET_SHARED_LIB} )

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)
