
#include "pch.h"

std::wstring Utf8ToWide(const std::string& utf8string)
{
	// Empty strings are equivalent
	if (utf8string.empty())
		return std::wstring();

	// Request number of wchars needed to fit this string (note some arguments are int instead of size_t)
	int wcharcount = MultiByteToWideChar(CP_UTF8, 0, utf8string.data(), (int)utf8string.size(), NULL, 0);

	// Conversion failed or still empty: return empty string
	if (wcharcount <= 0)
		return std::wstring();

	// Create a string to return and allocate memory for the content
	std::wstring buffer;
	buffer.resize(wcharcount);

	// Do the conversion
	MultiByteToWideChar(CP_UTF8, 0, utf8string.data(), (int)utf8string.size(), &(buffer.front()), wcharcount);

	// Return converted string
	return buffer;
}

std::string WideToUtf8(const std::wstring& widestring)
{
	// Empty strings are equivalent
	if (widestring.empty())
		return std::string();

	// Calculate bytes required for output buffer (note some arguments are int instead of size_t)
	int bytecount = WideCharToMultiByte(CP_UTF8, 0, widestring.data(), (int)widestring.size(), NULL, 0, NULL, NULL);

	// Conversion failed or still empty: return empty string
	if (bytecount <= 0)
		return std::string();

	// Create a string to return and allocate memory for the content
	std::string buffer;
	buffer.resize(bytecount);

	// Do the conversion
	WideCharToMultiByte(CP_UTF8, 0, widestring.data(), (int)widestring.size(), &(buffer.front()), bytecount, NULL, NULL);

	// Return converted string
	return buffer;
}

// Unpack parameters in plain-old-data (POD) format from the host app to a more useful
// type with a vector of ExtensionParameter.
std::vector<ExtensionParameter> UnpackExtensionParameterArray(size_t paramCount, const ExtensionParameterPOD* paramArr)
{
	std::vector<ExtensionParameter> ret;
	ret.reserve(paramCount);

	for (size_t i = 0; i < paramCount; ++i)
	{
		const ExtensionParameterPOD& epRaw = paramArr[i];

		ExtensionParameter ep = {};
		ep.type = epRaw.type;

		switch (epRaw.type) {
		case EPT_Boolean:		// boolean also stored in number field
		case EPT_Number:
			ep.number = epRaw.number;
			break;
		case EPT_String:
			ep.str = epRaw.str;
			break;
		}

		ret.push_back(ep);
	}

	return ret;
}

// Pack named parameters from a map in to a flat array in plain-old-data (POD) format for
// passing to the host app.
std::vector<NamedExtensionParameterPOD> PackNamedExtensionParameters(const std::map<std::string, ExtensionParameter>& params)
{
	std::vector<NamedExtensionParameterPOD> ret;
	ret.reserve(params.size());

	for (auto i = params.begin(), end = params.end(); i != end; ++i)
	{
		NamedExtensionParameterPOD nep = {};
		nep.key = i->first.c_str();
		nep.value.type = i->second.type;

		switch (i->second.type) {
		case EPT_Boolean:		// boolean also stored in number field
		case EPT_Number:
			nep.value.number = i->second.number;
			break;
		case EPT_String:
			nep.value.str = i->second.str.c_str();
			break;
		}

		ret.push_back(nep);
	}

	return ret;
}

//////////////////////////////////////////////////
// base64 encoding and decoding functions
// Based on code from: https://stackoverflow.com/questions/180947/base64-decode-snippet-in-c

const std::string base64_chars =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
"abcdefghijklmnopqrstuvwxyz"
"0123456789+/";

bool is_base64(BYTE c)
{
	return (isalnum(c) || (c == '+') || (c == '/'));
}

std::string base64_encode(const std::string& buffer)
{
	std::string ret;
	size_t i = 0;
	size_t j = 0;
	BYTE char_array_3[3] = {};
	BYTE char_array_4[4] = {};

	for (auto it = buffer.begin(), end = buffer.end(); it != end; ++it)
	{
		char_array_3[i++] = *it;
		if (i == 3) {
			char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
			char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
			char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
			char_array_4[3] = char_array_3[2] & 0x3f;

			for (i = 0; (i < 4); i++)
				ret += base64_chars[char_array_4[i]];
			i = 0;
		}
	}

	if (i)
	{
		for (j = i; j < 3; j++)
			char_array_3[j] = '\0';

		char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
		char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
		char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
		char_array_4[3] = char_array_3[2] & 0x3f;

		for (j = 0; (j < i + 1); j++)
			ret += base64_chars[char_array_4[j]];

		while ((i++ < 3))
			ret += '=';
	}

	return ret;
}

std::string base64_decode(const std::string& encoded_string)
{
	size_t in_len = encoded_string.size();
	size_t i = 0;
	size_t j = 0;
	size_t in_ = 0;
	BYTE char_array_4[4] = {};
	BYTE char_array_3[3] = {};
	std::string ret;

	while (in_len-- && (encoded_string[in_] != '=') && is_base64(encoded_string[in_])) {
		char_array_4[i++] = encoded_string[in_]; in_++;
		if (i == 4) {
			for (i = 0; i < 4; i++)
				char_array_4[i] = static_cast<BYTE>(base64_chars.find(char_array_4[i]));

			char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
			char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
			char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

			for (i = 0; (i < 3); i++)
				ret.push_back(char_array_3[i]);
			i = 0;
		}
	}

	if (i) {
		for (j = i; j < 4; j++)
			char_array_4[j] = 0;

		for (j = 0; j < 4; j++)
			char_array_4[j] = static_cast<BYTE>(base64_chars.find(char_array_4[j]));

		char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
		char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
		char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

		for (j = 0; (j < i - 1); j++)
			ret.push_back(char_array_3[j]);
	}

	return ret;
}