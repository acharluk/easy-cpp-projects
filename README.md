[![Version][version-badge]][marketplace]
[![Installs][installs-badge]][marketplace]
## Features

Create C++ projects and classes with just few clicks.

+ Creating a new Easy C++ project will do the following:
  - Project structure: Common folders like src, include and bin
  - Makefile: A makefile already set up to build and run your project
  - VSCode tasks: Configurations for building and running your project

+ Creating a Easy C++ class will create the appropiate files using one of the templates avaliable [here](https://github.com/acharluk/easy-cpp-projects/tree/master/templates/classes)


## Requirements

- You must have GCC and Make installed on your computer
    - GNU/Linux: Install GCC and Make using the package manager of your distribution, these are some of them:
        + Debian/Ubuntu/Mint: `sudo apt install g++ make`
        + Fedora: `sudo dnf install gcc-c++ make`
        + Arch Linux: `sudo pacman -S gcc make`
    - Windows:
        + Windows 10: Install GCC and Make on Windows through WSL: [Windows Subsystem for Linux setup](https://github.com/acharluk/UsefulStuff/blob/master/windows/setup_wsl.md)
        + Windows 8.1 or lower: Install GCC and Make using [Cygwin](https://www.cygwin.com/) or [MinGW](http://www.mingw.org/)
    - macOS: Check out [Brew](https://brew.sh/)
- You should install C/C++ extension for the best experience


## Release Notes

### 1.4.0

Added buttons to the status bar to `Build` and `Build & Run` your project

Added Ctrl+F7 and F7 to `Build` and `Build & Run` your project

Changed json format for classes to include compatibility for more than two files and other file extensions, used for templated class (.tpp)

Added file association for .tpp files


[version-badge]: https://vsmarketplacebadge.apphb.com/version/ACharLuk.easy-cpp-projects.svg
[installs-badge]: https://vsmarketplacebadge.apphb.com/installs/ACharLuk.easy-cpp-projects.svg
[marketplace]: https://marketplace.visualstudio.com/items?itemName=ACharLuk.easy-cpp-projects