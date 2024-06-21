
const C3 = globalThis.C3;

C3.Plugins.Xbox_UWP.Cnds =
{
	IsAvailable()
	{
		return this.isAvailable;
	},

	IsCreatorsProgram()
	{
		return this.isCreatorsProgram;
	},

	IsSignedIn()
	{
		return this.isSignedIn;
	},

	OnSignInSuccess()
	{
		return true;
	},

	OnSignInError()
	{
		return true;
	},

	OnSignInSilentlySuccess()
	{
		return true;
	},

	OnSignInSilentlyError()
	{
		return true;
	},

	OnSignOutCompleted()
	{
		return true;
	},

	OnSetPresenceSuccess()
	{
		return true;
	},

	OnSetPresenceFailed()
	{
		return true;
	},

	OnUpdateAchievementSuccess(achievementId)
	{
		return this._achievementId === achievementId;
	},

	OnUpdateAchievementFailed(achievementId)
	{
		return this._achievementId === achievementId;
	},

	OnUpdateAnyAchievementSuccess()
	{
		return true;
	},

	OnUpdateAnyAchievementFailed()
	{
		return true;
	},

	OnTitleStorageOperationSuccess(storageTag)
	{
		return this._storageTag === storageTag;
	},

	OnTitleStorageOperationFailed(storageTag)
	{
		return this._storageTag === storageTag;
	},

	OnAnyTitleStorageOperationSuccess()
	{
		return true;
	},

	OnAnyTitleStorageOperationFailed()
	{
		return true;
	}
};
