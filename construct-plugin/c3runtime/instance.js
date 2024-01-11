
const C3 = self.C3;

C3.Plugins.Xbox_UWP.Instance = class Xbox_UWPInstance extends C3.SDKInstanceBase
{
	constructor(inst, properties)
	{
		super(inst);

		// Set the wrapper extension component ID to match the one set in the DLL.
		// Then verify the wrapper extension is available.
		this.SetWrapperExtensionComponentId("scirra-xbox-uwp");
		this._isAvailable = this.IsWrapperExtensionAvailable();

		// General properties
		this._errorMessage = "";
		this._isCreatorsProgram = true;
		this._titleId = 0;
		this._scid = "";
		this._sandbox = "";

		// For triggers
		this._achievementId = "";
		this._storageTag = "";
		this._downloadText = "";		// for title storage

		//////////////////////////////////
		// State set once signed in
		this._isSignedIn = false;

		// The sign in status is a string that corresponds to the enum xbox::services::system::sign_in_status
		// in the C++ SDK. This is the empty string when not set, or one of "success",
		// "user-interaction-required" or "user-cancel" corresponding to the enum values.
		this._signInStatus = "";

		this._userGamerTag = "";
		this._userAgeGroup = "";
		this._userPrivileges = "";
		this._xboxUserId = "";

		//////////////////////////////////
		// Read properties and initialize
		if (properties)
		{
			this._titleId = properties[0];
			this._scid = properties[1];
			this._isCreatorsProgram = properties[2];
		}

		// Listen for sign out event sent from wrapper extension.
		this.AddWrapperExtensionMessageHandler("on-sign-out-completed", e => this._OnSignOutCompleted(e));

		// When wrapper extension is available, initialize it on startup.
		if (this._isAvailable)
		{
			this._runtime.AddLoadPromise(this._Init());
		}
	}

	async _Init()
	{
		// Send init message to wrapper extension and wait for completion
		const result = await this.SendWrapperExtensionMessageAsync("init");

		// Get sandbox if available on startup
		this._sandbox = result["sandbox"];
	}
	
	Release()
	{
		super.Release();
	}

	_IsAvailable()
	{
		return this._isAvailable;
	}

	_GetTitleId()
	{
		return this._titleId;
	}

	_GetSCID()
	{
		return this._scid;
	}

	_IsCreatorsProgram()
	{
		return this._isCreatorsProgram;
	}

	_GetSandbox()
	{
		return this._sandbox;
	}

	_IsSignedIn()
	{
		return this._isSignedIn;
	}

	_GetErrorMessage()
	{
		return this._errorMessage;
	}

	_GetSignInStatus()
	{
		return this._signInStatus;
	}

	_SetSignInStatusFromEnum(e)
	{
		// The wrapper extension sends the sign in status as the value of the xbox::services::system::sign_in_status
		// enum converted to a number. These values are converted to a string for better convenience.
		switch (e) {
		case 0:		// success
			// From the docs: "Signed in successfully."
			this._signInStatus = "success";
			break;
		case 1:		// user_interaction_required
			// From the docs: "Need to invoke the signin API (w/ UX) to let the user take necessary actions for the
			// sign-in operation to continue. Can only be returned from signin_silently()."
			this._signInStatus = "user-interaction-required";
			break;
		case 2:		// user_cancel
			// From the docs: "The user decided to cancel the sign-in operation. Can only be returned from signin()."
			this._signInStatus = "user-cancel";
			break;
		default:	// unexpected value
			this._signInStatus = "unknown";
			break;
		}
	}

	_GetGamerTag()
	{
		return this._userGamerTag;
	}

	_GetAgeGroup()
	{
		return this._userAgeGroup;
	}

	_GetPrivileges()
	{
		return this._userPrivileges;
	}

	_GetXboxUserId()
	{
		return this._xboxUserId;
	}

	async _SignIn()
	{
		if (!this._IsAvailable())
			return;

		const result = await this.SendWrapperExtensionMessageAsync("sign-in");

		// Both success and failure cases pass the sign in status.
		this._SetSignInStatusFromEnum(result["status"]);

		if (result["isOk"])
		{
			// Read back values provided when sign in completes
			this._isSignedIn = true;
			this._userGamerTag = result["gamerTag"];
			this._userAgeGroup = result["ageGroup"];
			this._userPrivileges = result["privileges"];
			this._xboxUserId = result["xboxUserId"];
			this._sandbox = result["sandbox"];		// sandbox is re-sent as may only be available when signed in

			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInSuccess);
		}
		else
		{
			this._errorMessage = result["errorMessage"];

			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInError);
		}
	}

	async _SignInSilently()
	{
		if (!this._IsAvailable())
			return;

		const result = await this.SendWrapperExtensionMessageAsync("sign-in-silently");

		// Both success and failure cases pass the sign in status.
		this._SetSignInStatusFromEnum(result["status"]);

		// This is handled the same as a standard sign in.
		if (result["isOk"])
		{
			this._isSignedIn = true;
			this._userGamerTag = result["gamerTag"];
			this._userAgeGroup = result["ageGroup"];
			this._userPrivileges = result["privileges"];
			this._xboxUserId = result["xboxUserId"];
			this._sandbox = result["sandbox"];

			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInSilentlySuccess);
		}
		else
		{
			this._errorMessage = result["errorMessage"];

			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInSilentlyError);
		}
	}

	_OnSignOutCompleted(e)
	{
		// Clear all sign in status
		this._isSignedIn = false;
		this._signInStatus = "";
		this._userGamerTag = "";
		this._userAgeGroup = "";
		this._userPrivileges = "";
		this._xboxUserId = "";
		
		this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignOutCompleted);
	}

	async _SetPresence(isActiveInTitle)
	{
		if (!this._IsAvailable())
			return;

		// Message wrapper extension and wait for result
		const result = await this.SendWrapperExtensionMessageAsync("set-presence", [isActiveInTitle]);

		if (result["isOk"])
		{
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSetPresenceSuccess);
		}
		else
		{
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnSetPresenceFailed);
		}
	}

	async _UpdateAchievement(achievementId, percentComplete)
	{
		if (!this._IsAvailable())
			return;
		
		// Message wrapper extension and wait for result
		const result = await this.SendWrapperExtensionMessageAsync("update-achievement", [achievementId, percentComplete]);

		// Set achievement ID for triggers
		this._achievementId = achievementId;

		if (result["isOk"])
		{
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAnyAchievementSuccess);
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAchievementSuccess);
		}
		else
		{
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAnyAchievementFailed);
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAchievementFailed);
		}
	}

	// For binary upload/download actions
	_GetBinaryDataSdkInstance(objectClass)
    {
        if (!objectClass)
            return null;
            
        const target = objectClass.GetFirstPicked(this._inst);

        if (!target)
            return null;

        return target.GetSdkInstance();
	}

	// For binary upload/download actions
	_TriggerTitleStorageOperationResult(isOk, storageTag)
	{
		// Set storage tag for triggers
		this._storageTag = storageTag;

		if (isOk)
		{
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnAnyTitleStorageOperationSuccess);
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnTitleStorageOperationSuccess);
		}
		else
		{
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnAnyTitleStorageOperationFailed);
			this.Trigger(C3.Plugins.Xbox_UWP.Cnds.OnTitleStorageOperationFailed);
		}

		this._storageTag = "";
	}

	SaveToJson()
	{
		return {
			// data to be saved for savegames
		};
	}
	
	LoadFromJson(o)
	{
		// load state for savegames
	}

	GetScriptInterfaceClass()
	{
		return self.IXboxUWPInstance;
	}
};

// Script interface. Use a WeakMap to safely hide the internal implementation details from the
// caller using the script interface.
const map = new WeakMap();

self.IXboxUWPInstance = class IXboxUWPInstance extends self.IInstance {
	constructor()
	{
		super();
		
		// Map by SDK instance
		map.set(this, self.IInstance._GetInitInst().GetSdkInstance());
	}

	/*
	// Example setter/getter property on script interface
	set testProperty(n)
	{
		map.get(this)._SetTestProperty(n);
	}

	get testProperty()
	{
		return map.get(this)._GetTestProperty();
	}
	*/
};
