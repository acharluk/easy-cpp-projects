@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2017\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64
set compilerflags=/Od /Zi /EHsc /std:c++latest /I include
set linkerflags=/OUT:bin\main.exe
cl.exe %compilerflags% src\*.cpp /link %linkerflags%
del bin\*.ilk *.obj *.pdb bin\*.pdb