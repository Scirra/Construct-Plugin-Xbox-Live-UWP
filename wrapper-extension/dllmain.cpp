#include "pch.h"

// Disable "warning C4447: 'main' signature found without threading model. Consider using 'int main(Platform::Array<Platform::String^>^ args)'"
#pragma warning(disable:4447)

BOOL APIENTRY DllMain(HMODULE /* hModule */, DWORD ul_reason_for_call, LPVOID /* lpReserved */)
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}
