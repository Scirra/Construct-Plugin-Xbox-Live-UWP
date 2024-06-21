
const C3 = globalThis.C3;

class Xbox_UWPInstance extends globalThis.ISDKInstanceBase
{
	_isAvailable: boolean;

	_errorMessage: string;
	_isCreatorsProgram: boolean;
	_titleId: number;
	_scid: string;
	_sandbox: string;

	_achievementId: string;
	_storageTag: string;
	_downloadText: string;

	_isSignedIn: boolean;
	_signInStatus: string;
	_userGamerTag: string;
	_userAgeGroup: string;
	_userPrivileges: string;
	_xboxUserId: string;

	constructor()
	{
		// Set the wrapper extension component ID to match the one set in the DLL.
		// Then verify the wrapper extension is available.
		super({ wrapperComponentId: "scirra-xbox-uwp" });

		this._isAvailable = this._isWrapperExtensionAvailable();

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
		const properties = this._getInitProperties();
		if (properties)
		{
			this._titleId = properties[0] as number;
			this._scid = properties[1] as string;
			this._isCreatorsProgram = properties[2] as boolean;
		}

		// Listen for sign out event sent from wrapper extension.
		this._addWrapperExtensionMessageHandler("on-sign-out-completed", () => this._onSignOutCompleted());

		// When wrapper extension is available, initialize it on startup.
		if (this._isAvailable)
		{
			this.runtime.addLoadPromise(this._init());
		}
	}

	async _init()
	{
		// Send init message to wrapper extension and wait for completion
		const result = await this._sendWrapperExtensionMessageAsync("init") as JSONObject;

		// Get sandbox if available on startup
		this._sandbox = result["sandbox"] as string;
	}
	
	_release()
	{
		super._release();
	}

	get isAvailable()
	{
		return this._isAvailable;
	}

	get titleId()
	{
		return this._titleId;
	}

	get scid()
	{
		return this._scid;
	}

	get isCreatorsProgram()
	{
		return this._isCreatorsProgram;
	}

	get sandbox()
	{
		return this._sandbox;
	}

	get isSignedIn()
	{
		return this._isSignedIn;
	}

	get errorMessage()
	{
		return this._errorMessage;
	}

	get signInStatus()
	{
		return this._signInStatus;
	}

	_setSignInStatusFromEnum(e: number)
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

	get gamerTag()
	{
		return this._userGamerTag;
	}

	get ageGroup()
	{
		return this._userAgeGroup;
	}

	get priviliges()
	{
		return this._userPrivileges;
	}

	get xboxUserId()
	{
		return this._xboxUserId;
	}

	async signIn()
	{
		if (!this._isAvailable)
			return;

		const result = await this._sendWrapperExtensionMessageAsync("sign-in") as JSONObject;

		// Both success and failure cases pass the sign in status.
		this._setSignInStatusFromEnum(result["status"] as number);

		if (result["isOk"])
		{
			// Read back values provided when sign in completes
			this._isSignedIn = true;
			this._userGamerTag = result["gamerTag"] as string;
			this._userAgeGroup = result["ageGroup"] as string;
			this._userPrivileges = result["privileges"] as string;
			this._xboxUserId = result["xboxUserId"] as string;
			this._sandbox = result["sandbox"] as string;		// sandbox is re-sent as may only be available when signed in

			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInSuccess);
		}
		else
		{
			this._errorMessage = result["errorMessage"] as string;

			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInError);
		}
	}

	async signInSilently()
	{
		if (!this._isAvailable)
			return;

		const result = await this._sendWrapperExtensionMessageAsync("sign-in-silently") as JSONObject;

		// Both success and failure cases pass the sign in status.
		this._setSignInStatusFromEnum(result["status"] as number);

		// This is handled the same as a standard sign in.
		if (result["isOk"])
		{
			this._isSignedIn = true;
			this._userGamerTag = result["gamerTag"] as string;
			this._userAgeGroup = result["ageGroup"] as string;
			this._userPrivileges = result["privileges"] as string
			this._xboxUserId = result["xboxUserId"] as string;
			this._sandbox = result["sandbox"] as string;

			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInSilentlySuccess);
		}
		else
		{
			this._errorMessage = result["errorMessage"] as string;

			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignInSilentlyError);
		}
	}

	_onSignOutCompleted()
	{
		// Clear all sign in status
		this._isSignedIn = false;
		this._signInStatus = "";
		this._userGamerTag = "";
		this._userAgeGroup = "";
		this._userPrivileges = "";
		this._xboxUserId = "";
		
		this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSignOutCompleted);
	}

	async setPresence(isActiveInTitle: boolean)
	{
		if (!this._isAvailable)
			return;

		// Message wrapper extension and wait for result
		const result = await this._sendWrapperExtensionMessageAsync("set-presence", [isActiveInTitle]) as JSONObject;

		if (result["isOk"])
		{
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSetPresenceSuccess);
		}
		else
		{
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnSetPresenceFailed);
		}
	}

	async updateAchievement(achievementId: string, percentComplete: number)
	{
		if (!this._isAvailable)
			return;
		
		// Message wrapper extension and wait for result
		const result = await this._sendWrapperExtensionMessageAsync("update-achievement", [achievementId, percentComplete]) as JSONObject;

		// Set achievement ID for triggers
		this._achievementId = achievementId;

		if (result["isOk"])
		{
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAnyAchievementSuccess);
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAchievementSuccess);
		}
		else
		{
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAnyAchievementFailed);
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnUpdateAchievementFailed);
		}
	}

	// For binary upload/download actions
	_triggerTitleStorageOperationResult(isOk: boolean, storageTag: string)
	{
		// Set storage tag for triggers
		this._storageTag = storageTag;

		if (isOk)
		{
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnAnyTitleStorageOperationSuccess);
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnTitleStorageOperationSuccess);
		}
		else
		{
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnAnyTitleStorageOperationFailed);
			this._trigger(C3.Plugins.Xbox_UWP.Cnds.OnTitleStorageOperationFailed);
		}

		this._storageTag = "";
	}

	_saveToJson()
	{
		return {
			// data to be saved for savegames
		};
	}
	
	_loadFromJson(o: JSONValue)
	{
		// load state for savegames
	}
};

C3.Plugins.Xbox_UWP.Instance = Xbox_UWPInstance;

export type { Xbox_UWPInstance as SDKInstanceClass };
