
const C3 = self.C3;

C3.Plugins.Xbox_UWP.Exps =
{
    ErrorMessage()
    {
        return this._GetErrorMessage();
    },

    TitleID()
    {
        return this._GetTitleId()
    },

    SCID()
    {
        return this._GetSCID();
    },

    Sandbox()
    {
        return this._GetSandbox();
    },

    SignInStatus()
    {
        return this._GetSignInStatus();
    },

    GamerTag()
    {
        return this._GetGamerTag();
    },

    AgeGroup()
    {
        return this._GetAgeGroup();
    },

    Privileges()
    {
        return this._GetPrivileges();
    },

    XboxUserId()
    {
        return this._GetXboxUserId();
    },

    AchievementID()
    {
        return this._achievementId;
    },

    StorageTag()
    {
        return this._storageTag;
    },

    DownloadText()
    {
        return this._downloadText;
    }
};
