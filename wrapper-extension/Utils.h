#pragma once

#include "IExtension.h"

// Convert std::string with UTF-8 encoding to std::wstring
std::wstring Utf8ToWide(const std::string& utf8string);

// Convert std::wstring to std::string with UTF-8 encoding
std::string WideToUtf8(const std::wstring& widestring);

// Helper methods for sending data over DLL boundary
std::vector<ExtensionParameter> UnpackExtensionParameterArray(size_t paramCount, const ExtensionParameterPOD* paramArr);
std::vector<NamedExtensionParameterPOD> PackNamedExtensionParameters(const std::map<std::string, ExtensionParameter>& params);

// Base64 functions
std::string base64_encode(const std::string& buffer);
std::string base64_decode(const std::string& encoded_string);