
const SDK = self.SDK;

const PLUGIN_CLASS = SDK.Plugins.Xbox_UWP;

PLUGIN_CLASS.Type = class Xbox_UWPType extends SDK.ITypeBase
{
	constructor(sdkPlugin, iObjectType)
	{
		super(sdkPlugin, iObjectType);
	}
};
