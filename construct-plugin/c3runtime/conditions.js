
const C3 = self.C3;

C3.Plugins.Xbox_UWP.Cnds =
{
	IsAvailable()
	{
		return this._IsAvailable();
	},

	IsCreatorsProgram()
	{
		return this._IsCreatorsProgram();
	},

	IsSignedIn()
	{
		return this._IsSignedIn();
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
