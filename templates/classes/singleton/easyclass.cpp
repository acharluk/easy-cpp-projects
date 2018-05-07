#include "easyclass.hpp"

easyclass::easyclass() {

}

easyclass& easyclass::getInstance() {
    static easyclass instance;
    return instance;
}