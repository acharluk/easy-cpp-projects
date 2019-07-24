@echo off
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64
) else (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
)
set compilerflags=/Od /Zi /EHsc /std:c++latest /I include
set linkerflags=/OUT:bin\main.exe

REM ====================== Manually Adding Header file in subdirs ======================
REM set SRC=src\*.cpp
REM set SRC=%SRC% src\test\*.cpp
REM set SRC=%SRC% include\*.cpp

REM ==================== Automatically Adding all Header file in subdirs ====================
SETLOCAL ENABLEDELAYEDEXPANSION
for /f "delims=" %%A in ('forfiles /s /m *.cpp /c "cmd /c echo @relpath"') do (set SRC=!SRC! %%~A)

cl.exe %compilerflags% %SRC% /link %linkerflags%"

del bin\*.ilk bin\*.pdb *.obj *.pdb