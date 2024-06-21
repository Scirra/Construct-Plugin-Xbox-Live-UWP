
const C3 = globalThis.C3;

// The binary title storage actions need to convert the data from an ArrayBuffer in
// the Binary Data object to a base64 string for transmission to the wrapper extension,
// which then converts it back again, as messages are all sent in JSON format.
// These methods handle the conversion.
function ArrayBufferToBase64(arrayBuffer)
{
    let binaryStr = '';
    const uint8arr = new Uint8Array(arrayBuffer);

    for (let i = 0, len = uint8arr.byteLength; i < len; ++i)
	{
        binaryStr += String.fromCharCode(uint8arr[i]);
    }

    return globalThis.btoa(binaryStr);
}

function Base64ToArrayBuffer(base64str)
{
    const binaryStr = atob(base64str);
    const uint8arr = new Uint8Array(binaryStr.length);

    for (let i = 0, len = binaryStr.length; i < len; ++i)
	{
        uint8arr[i] = binaryStr.charCodeAt(i);
    }

    return uint8arr.buffer;
}

// Construct's storage type combo parameters for title storage do not map directly to values of
// the enum xbox::services::title_storage::title_storage_type. Therefore this function converts
// one of Construct's combo parameter indices to the correct Xbox enum value.
function StorageTypeComboToEnum(c)
{
    switch (c) {
    case 0:         // combo item "trusted-platform-storage"
        return 0;   // xbox::services::title_storage::title_storage_type::trusted_platform_storage
    case 1:         // combo item "global-storage"
        return 2;   // xbox::services::title_storage::title_storage_type::global_storage
    case 2:         // combo item "universal"
        return 5;   // xbox::services::title_storage::title_storage_type::universal
    default:
        return 5;   // treat as "universal"
    }
}

// Construct's blob type combo parameters for title storage correspond to the enum
// xbox::services::title_storage::title_storage_blob_type, with the sole exception that
// the 'unknown' value (0) is omitted, as it doesn't seem to be a valid type for uploads
// (presumably it is some kind of placeholder). All other values line up though, so
// the combo can be converted to an enum by adding 1 to it.
function BlobTypeComboToEnum(c)
{
    return c + 1;
}

C3.Plugins.Xbox_UWP.Acts =
{
	SignIn()
    {
        // async action
        return this.signIn();
    },

    SignInSilently()
    {
        // async action
        return this.signInSilently();
    },

    SetPresence(isActiveInTitle)
    {
        // async action
        return this.setPresence(isActiveInTitle);
    },

    UpdateAchievement(achievementId, percentComplete)
    {
        // async action
        return this.updateAchievement(achievementId, percentComplete);
    },

    // Title storage actions
    async TitleStorageUploadBinary(storageType, path, objectClass, blobType, storageTag)
    {
        if (!this._isAvailable)
			return;

        // Get Binary Data instance from the object parameter, and get its content in base64 format.
		const binInst = objectClass.getFirstInstance();
		if (!binInst)
			return;
		
		const content = ArrayBufferToBase64(binInst.getArrayBufferReadOnly());

        // Post an upload message to the wrapper extension with the base64 string as the data.
        const result = await this._sendWrapperExtensionMessageAsync("title-storage-upload-blob",
            [path, BlobTypeComboToEnum(blobType), StorageTypeComboToEnum(storageType), true /* isBase64 */, content]);

        // Fire triggers depending on the result.
        this._triggerTitleStorageOperationResult(result["isOk"], storageTag);
    },

    async TitleStorageUploadText(storageType, path, data, blobType, storageTag)
    {
        if (!this._isAvailable)
			return;

        // Post an upload message to the wrapper extension with just the string as the data to upload.
        const result = await this._sendWrapperExtensionMessageAsync("title-storage-upload-blob",
            [path, BlobTypeComboToEnum(blobType), StorageTypeComboToEnum(storageType), false /* isBase64 */, data]);

        // Fire triggers depending on the result.
        this._triggerTitleStorageOperationResult(result["isOk"], storageTag);
    },

    async TitleStorageDownloadBinary(storageType, path, objectClass, blobType, storageTag)
    {
        if (!this._isAvailable)
			return;

        // Get Binary Data SDK instance from the object parameter.
		const binInst = objectClass.getFirstInstance();
		if (!binInst)
			return;

        // Post a download message to the wrapper extension, asking for the data to be returned as a base64
        // string as it is retrieving binary data.
        const result = await this._sendWrapperExtensionMessageAsync("title-storage-download-blob",
            [path, BlobTypeComboToEnum(blobType), StorageTypeComboToEnum(storageType), true /* asBase64 */]);
        
        // If the result is OK, convert the returned base64 back to an ArrayBuffer and store it in
        // the Binary Data object.
        if (result["isOk"])
        {
            const arrayBuffer = Base64ToArrayBuffer(result["data"]);
            binInst.setArrayBufferTransfer(arrayBuffer);		// can take ownership of returned data
        }

        // Fire triggers depending on the result.
        this._triggerTitleStorageOperationResult(result["isOk"], storageTag);
    },

    async TitleStorageDownloadText(storageType, path, blobType, storageTag)
    {
        if (!this._isAvailable)
			return;

        // Post a download message to the wrapper extension, asking for the data as a normal string
        // (not base64 encoded).
        const result = await this._sendWrapperExtensionMessageAsync("title-storage-download-blob",
            [path, BlobTypeComboToEnum(blobType), StorageTypeComboToEnum(storageType), false /* asBase64 */]);
        
        // If the result is OK, store the returned string for the DownloadText expression.
        if (result["isOk"])
        {
            this._downloadText = result["data"];
        }

        // Fire triggers depending on the result.
        this._triggerTitleStorageOperationResult(result["isOk"], storageTag);
    },

    async TitleStorageDelete(storageType, path, blobType, storageTag)
    {
        if (!this._isAvailable)
			return;

        // Post a delete message to the wrapper extension.
        const result = await this._sendWrapperExtensionMessageAsync("title-storage-delete-blob",
            [path, BlobTypeComboToEnum(blobType), StorageTypeComboToEnum(storageType)]);

        // Fire triggers depending on the result.
        this._triggerTitleStorageOperationResult(result["isOk"], storageTag);
    }
};
