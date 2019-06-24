# Change Log

## 1.7.6

Added support for Visual Studio Build Tools 2019

## 1.7.5

Added "openFiles" property to JSON. It allows the user to set multiple files to open automatically on project creation

## 1.7.4

Fix Easy C++ placeholder not being created when using a custom template

## 1.7.3

New files.json format, now each template can have different directories and blank files created

## 1.7.2

Added "Convert this folder to an Easy C++ Project" command

## 1.7.1

Load extension when the file .vscode/.easycpp is present, avoiding loading it when there is a tasks.json but it is not an Easy C++ project

## 1.7.0

Added support for offline templates if there is no Internet connection avaliable

Added support for custom templates

Added "Open Custom Templates Directory" command

## 1.6.0

Added `Create getter`, `Create setter` and `Create getter and setter` commands. This is in very early stages, so bugs will happen. Please report any bugs to the issues page on GitHub :)

## 1.5.3

Updated readme

## 1.5.2

Fix Windows using PowerShell

## 1.5.1

Fix files opening only in preview

## 1.5.0

Added configuration to force use of cmd.exe in Windows instead of PowerShell

Open both files when creating a class, avoid previewing only

Added debugging configurations for GDB and Visual Studio Debugger

## 1.4.2

Redone readme to add MSVC and Clang explanations

## 1.4.1

Fixed button icons not working

## 1.4.0

Added buttons to the status bar to `Build` and `Build & Run` your project

Added Ctrl+F7 and F7 to `Build` and `Build & Run` your project

Changed json format for classes to include compatibility for more than two files and other file extensions, used for templated class (.tpp)

Added file association for .tpp files

## 1.3.0

Class creation using templates!

## 1.2.1

Use VSCode's `showWorkspaceFolderPick` function for folder picking

## 1.2.0

Add support for multi-root workspaces

## 1.1.4

Add a logo to the extension!

## 1.1.3

Fix error messages not being shown

## 1.1.2

Force user to open a folder before creating a project

## 1.1.1

Optimizations

Updated readme

## 1.1.0

Added support for multiple templates

## 1.0.1

Update readme to add WSL setup link

## 1.0.0

Initial release