
const SDK = globalThis.SDK;

////////////////////////////////////////////
// The plugin ID is how Construct identifies different kinds of plugins.
// *** NEVER CHANGE THE PLUGIN ID! ***
// If you change the plugin ID after releasing the plugin, Construct will think it is an entirely different
// plugin and assume it is incompatible with the old one, and YOU WILL BREAK ALL EXISTING PROJECTS USING THE PLUGIN.
// Only the plugin name is displayed in the editor, so to rename your plugin change the name but NOT the ID.
// If you want to completely replace a plugin, make it deprecated (it will be hidden but old projects keep working),
// and create an entirely new plugin with a different plugin ID.
const PLUGIN_ID = "Xbox_UWP";
////////////////////////////////////////////

const PLUGIN_CATEGORY = "platform-specific";

const PLUGIN_CLASS = SDK.Plugins.Xbox_UWP = class Xbox_UWPPlugin extends SDK.IPluginBase
{
	constructor()
	{
		super(PLUGIN_ID);
		
		SDK.Lang.PushContext("plugins." + PLUGIN_ID.toLowerCase());
		
		this._info.SetName(self.lang(".name"));
		this._info.SetDescription(self.lang(".description"));
		this._info.SetCategory(PLUGIN_CATEGORY);
		this._info.SetAuthor("Scirra");
		this._info.SetHelpUrl(self.lang(".help-url"));
		this._info.SetIsSingleGlobal(true);
		this._info.SetRuntimeModuleMainScript("c3runtime/main.js");
		
		SDK.Lang.PushContext(".properties");
		
		this._info.SetProperties([
			new SDK.PluginProperty("integer", "title-id", 0),
			new SDK.PluginProperty("text", "scid", ""),
			new SDK.PluginProperty("check", "creators-program", true)
		]);
		
		SDK.Lang.PopContext();		// .properties
		
		SDK.Lang.PopContext();
		
		// Bundle the wrapper extension DLL with the Xbox UWP export option.
		this._info.AddFileDependency({
			filename: "XboxUWP_x64.ext.dll",
			type: "wrapper-extension",
			platform: "xbox-uwp-x64"
		});
	}
};

PLUGIN_CLASS.Register(PLUGIN_ID, PLUGIN_CLASS);
