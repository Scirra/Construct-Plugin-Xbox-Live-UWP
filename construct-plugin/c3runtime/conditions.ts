
import type { SDKInstanceClass } from "./instance.ts";

const C3 = globalThis.C3;

C3.Plugins.Xbox_UWP.Cnds =
{
	IsAvailable(this: SDKInstanceClass)
	{
		return this.isAvailable;
	},

	IsCreatorsProgram(this: SDKInstanceClass)
	{
		return this.isCreatorsProgram;
	},

	IsSignedIn(this: SDKInstanceClass)
	{
		return this.isSignedIn;
	},

	OnSignInSuccess(this: SDKInstanceClass)
	{
		return true;
	},

	OnSignInError(this: SDKInstanceClass)
	{
		return true;
	},

	OnSignInSilentlySuccess(this: SDKInstanceClass)
	{
		return true;
	},

	OnSignInSilentlyError(this: SDKInstanceClass)
	{
		return true;
	},

	OnSignOutCompleted(this: SDKInstanceClass)
	{
		return true;
	},

	OnSetPresenceSuccess(this: SDKInstanceClass)
	{
		return true;
	},

	OnSetPresenceFailed(this: SDKInstanceClass)
	{
		return true;
	},

	OnUpdateAchievementSuccess(this: SDKInstanceClass, achievementId: string)
	{
		return this._achievementId === achievementId;
	},

	OnUpdateAchievementFailed(this: SDKInstanceClass, achievementId: string)
	{
		return this._achievementId === achievementId;
	},

	OnUpdateAnyAchievementSuccess(this: SDKInstanceClass)
	{
		return true;
	},

	OnUpdateAnyAchievementFailed(this: SDKInstanceClass)
	{
		return true;
	},

	OnTitleStorageOperationSuccess(this: SDKInstanceClass, storageTag: string)
	{
		return this._storageTag === storageTag;
	},

	OnTitleStorageOperationFailed(this: SDKInstanceClass, storageTag: string)
	{
		return this._storageTag === storageTag;
	},

	OnAnyTitleStorageOperationSuccess(this: SDKInstanceClass)
	{
		return true;
	},

	OnAnyTitleStorageOperationFailed(this: SDKInstanceClass)
	{
		return true;
	}
};
