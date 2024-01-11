
#include "IApplication.h"
#include "IExtension.h"

// Some using/typedef declarations to bring in commonly used types for better code readability
typedef std::vector<unsigned char> BlobBuffer;
using xbox::services::xbox_live_result;
using xbox::services::system::sign_in_result;
using namespace xbox::services::title_storage;

class WrapperExtension : public IExtension {
public:
	WrapperExtension(IApplication* iApplication_);

	// IExtension overrides
	void Init();
	void Release();
	void OnMainWindowCreated(HWND hWnd_);

	void OnWebMessage(LPCSTR messageId, size_t paramCount, const ExtensionParameterPOD* paramArr, double asyncId);

	// Helper methods
	void HandleWebMessage(const std::string& messageId, const std::vector<ExtensionParameter>& params, double asyncId);
	void SendWebMessage(const std::string& messageId, const std::map<std::string, ExtensionParameter>& params, double asyncId = -1.0);
	void SendAsyncResponse(const std::map<std::string, ExtensionParameter>& params, double asyncId);

	// Init message handler
	void OnInitMessage(double asyncId);

	// Sign in methods
	void OnSignInMessage(double asyncId);
	void OnSignInSilentlyMessage(double asyncId);
	void HandleSignInResult(xbox_live_result<sign_in_result> result, double asyncId);

	// Sign out (Xbox services callback)
	void OnSignOutCompleted(xbox_live_user_t xboxLiveUser);

	// Other message handlers
	void OnUpdateAchievementMessage(const std::string& achievementId, uint32_t percentComplete, double asyncId);
	void OnSetPresenceMessage(bool isUserActiveInTitle, double asyncId);

	void OnTitleStorageUploadBlobMessage(const std::string& blobPath, title_storage_blob_type blobType, title_storage_type storageType, std::shared_ptr<BlobBuffer> blobBuffer, double asyncId);
	void OnTitleStorageDownloadBlobMessage(const std::string& blobPath, title_storage_blob_type blobType, title_storage_type storageType, bool asBase64, double asyncId);
	void OnTitleStorageDeleteBlobMessage(const std::string& blobPath, title_storage_blob_type blobType, title_storage_type storageType,
		double asyncId);


protected:
	IApplication* iApplication;

	// The Xbox Live user and context for accessing the API
	std::shared_ptr<xbox::services::system::xbox_live_user> xblUser;
	std::shared_ptr<xbox::services::xbox_live_context> xblContext;
};