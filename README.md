# Construct Xbox Live UWP plugin

This repository contains code for the Xbox Live UWP Construct plugin, and its associated wrapper extension (a DLL which integrates the Xbox Live API). This allows integrating Construct projects with Xbox Live when using the Xbox UWP export option. The features it covers includes:

- Sign in, and information about the signed in user
- Presence
- Update achievement
- Title storage (upload, download and delete blobs)

There are two main components in this repository:

- *construct-plugin*: the Construct plugin, written in JavaScript using the [Construct Addon SDK](https://github.com/Scirra/Construct-Addon-SDK)
- *wrapper-extension*: a Visual Studio **2017** (note the version is significant - see below) project to build the wrapper extension Universal Windows DLL, written in C++.

The wrapper extension builds an *.ext.dll* file in the *construct-plugin* subfolder. The Construct plugin is configured to load that DLL in the Xbox UWP exporter, and then communicates with it via a messaging API.

## Build

To build the wrapper extension, you will need **Visual Studio 2017** specifically. Newer versions of Visual Studio will not be able to build the DLL (unless perhaps you install the v141 build tools, which are the same as used by Visual Studio 2017). This is because the Xbox Live C++ API is based on the NuGet package [Microsoft.Xbox.Live.SDK.Cpp.UWP](https://www.nuget.org/packages/Microsoft.Xbox.Live.SDK.Cpp.UWP), which has not been updated since 2018, and only provides library files for build tools v140 (Visual Studio 2015) and v141 (Visual Studio 2017). Microsoft would need to update the library to allow it to build with newer versions of Visual Studio, but currently they describe it as "community supported" and are not actively mainaining it or providing support for it themselves.

Note that Visual Studio 2017 is only necessary to build the wrapper extension DLL (*XboxUWP_x64.ext.dll*). The Visual Studio project provided by Construct's Xbox UWP exporter can use newer versions of Visual Studio, such as Visual Studio 2022. If you use multiple versions of Visual Studio, be sure to make sure you open the wrapper extension solution with Visual Studio 2017 specifically.

> [!NOTE]
> The wrapper extension DLL is configured as a Universal Windows DLL for compatibility with the Universal Windows Platform (UWP). This is a different kind of DLL to the standard wrapper extension SDK which builds a traditional Win32 DLL.

> [!WARNING]
> If you want to modify the plugin for your own purposes, we strongly advise to **change the Construct plugin ID.** This will avoid serious compatibility problems which could result in your project becoming unopenable.

## Testing

Use [developer mode](https://www.construct.net/en/make-games/manuals/addon-sdk/guide/using-developer-mode) for a more convenient way to test the Construct plugin during development.

A sample Construct project is provided in this repository which is just a technical test of the plugin features.

Note to successfully test Xbox Live features you will need to have correctly configured an application in the Microsoft Partner Center and associated your exported Visual Studio project with the application. For more information refer to the Xbox Live UWP plugin documentation.

## Distributing

The Construct plugin is distributed as a [.c3addon file](https://www.construct.net/en/make-games/manuals/addon-sdk/guide/c3addon-file), which is essentially a renamed zip file with the addon files.

> [!WARNING]
> If you want to modify the plugin for your own purposes, we strongly advise to **change the Construct plugin ID.** This will avoid serious compatibility problems which could result in your project becoming unopenable. Further, if you wish to add support for more Steam API methods, you may be better off creating an independent plugin rather than modifying this one. For more information see the [Contributing guide](https://github.com/Scirra/Construct-Plugin-Steamworks/blob/main/CONTRIBUTING.md).

## Support

As Microsoft describe the Xbox Live library as "community supported", it is difficult for us to provide any support for this plugin, as we are unlikely to be able to get any help from Microsoft should any issues be found. The code here mainly just allows JavaScript code in a Construct plugin to call the C++ Xbox Live API; all the code relevant to actually interacting with Xbox Live services is in Microsoft's library. Further it is difficult for Scirra to assist where issues arise from an incorrect configuration, as that is not under our control and we cannot easily review or reproduce your own setup. (In cases where it relates to configuring your app, Microsoft may still be able to provide support.) So in general we can only provide "best effort" support for this plugin, and in some cases you may have to use the source code here to debug problems or develop new additions yourself.

## Contributing

We are willing to merge high quality code changes which follow the existing code style and are tested and verified to work in a real development environment. However as all the code here is open source, you can also create your own private copy of the plugin and make any alterations you want. If you want to modify the plugin for your own purposes, we strongly advise to **change the Construct plugin ID.** This will avoid serious compatibility problems which could result in your project becoming unopenable.

## License

This code is published under the [MIT license](LICENSE).