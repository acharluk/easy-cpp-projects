#pragma once

class easyclass {

public:
    static easyclass& getInstance();
    
    easyclass(easyclass const&) = delete;
    void operator=(easyclass const&) = delete;

private:
    easyclass();
};