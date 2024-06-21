
const SDK = globalThis.SDK;

const PLUGIN_CLASS = SDK.Plugins.Xbox_UWP;

PLUGIN_CLASS.Type = class Xbox_UWPType extends SDK.ITypeBase
{
	constructor(sdkPlugin: SDK.IPluginBase, iObjectType: SDK.IObjectType)
	{
		super(sdkPlugin, iObjectType);
	}
};

export {}
