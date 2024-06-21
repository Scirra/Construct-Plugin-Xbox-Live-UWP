
import type { SDKInstanceClass } from "./instance.ts";

const C3 = globalThis.C3;

C3.Plugins.Xbox_UWP.Exps =
{
    ErrorMessage(this: SDKInstanceClass)
    {
        return this.errorMessage;
    },

    TitleID(this: SDKInstanceClass)
    {
        return this.titleId;
    },

    SCID(this: SDKInstanceClass)
    {
        return this.scid;
    },

    Sandbox(this: SDKInstanceClass)
    {
        return this.sandbox;
    },

    SignInStatus(this: SDKInstanceClass)
    {
        return this.signInStatus;
    },

    GamerTag(this: SDKInstanceClass)
    {
        return this.gamerTag;
    },

    AgeGroup(this: SDKInstanceClass)
    {
        return this.ageGroup;
    },

    Privileges(this: SDKInstanceClass)
    {
        return this.priviliges;
    },

    XboxUserId(this: SDKInstanceClass)
    {
        return this.xboxUserId;
    },

    AchievementID(this: SDKInstanceClass)
    {
        return this._achievementId;
    },

    StorageTag(this: SDKInstanceClass)
    {
        return this._storageTag;
    },

    DownloadText(this: SDKInstanceClass)
    {
        return this._downloadText;
    }
};
