
#include "pch.h"
#include "WrapperExtension.h"

//////////////////////////////////////////////////////
// Boilerplate stuff - don't change
WrapperExtension* g_Extension = nullptr;

// Main DLL export function to initialize extension.
extern "C" {
	__declspec(dllexport) IExtension* WrapperExtInit(IApplication* iApplication)
	{
		g_Extension = new WrapperExtension(iApplication);
		return g_Extension;
	}
}

// Helper method to call HandleWebMessage() with more useful types, as OnWebMessage() must deal with
// plain-old-data types for crossing a DLL boundary.
void WrapperExtension::OnWebMessage(LPCSTR messageId_, size_t paramCount, const ExtensionParameterPOD* paramArr, double asyncId)
{
	HandleWebMessage(messageId_, UnpackExtensionParameterArray(paramCount, paramArr), asyncId);
}

// Helper method to call iApplication->SendWebMessage() with more useful types, as the interface must deal with
// plain-old-data types for crossing a DLL boundary.
void WrapperExtension::SendWebMessage(const std::string& messageId, const std::map<std::string, ExtensionParameter>& params, double asyncId)
{
	std::vector<NamedExtensionParameterPOD> paramArr = PackNamedExtensionParameters(params);
	iApplication->SendWebMessage(messageId.c_str(), paramArr.size(), paramArr.empty() ? nullptr : paramArr.data(), asyncId);
}

// Helper method for sending a response to an async message (when asyncId is not -1.0).
// In this case the message ID is not used, so this just calls SendWebMessage() with an empty message ID.
void WrapperExtension::SendAsyncResponse(const std::map<std::string, ExtensionParameter>& params, double asyncId)
{
	SendWebMessage("", params, asyncId);
}

//////////////////////////////////////////////////////
// Custom implementation for your wrapper extension
WrapperExtension::WrapperExtension(IApplication* iApplication_)
	: iApplication(iApplication_)
{
	OutputDebugString(L"[Xbox] Loading Xbox wrapper extension\n");

	// Tell the host application the SDK version used. Don't change this.
	iApplication->SetSdkVersion(WRAPPER_EXT_SDK_VERSION);

	// Call to register a component ID for JavaScript messaging
	iApplication->RegisterComponentId("scirra-xbox-uwp");
}

void WrapperExtension::Init()
{
	// Called during startup after all other extensions have been loaded.
}

void WrapperExtension::Release()
{
}

void WrapperExtension::OnMainWindowCreated(HWND hWnd)
{
	// not applicable in UWP
}

// Handle a message sent from JavaScript.
// This method mostly just unpacks parameters and calls a dedicated handler method.
void WrapperExtension::HandleWebMessage(const std::string& messageId, const std::vector<ExtensionParameter>& params, double asyncId)
{
	if (messageId == "init")
	{
		OnInitMessage(asyncId);
	}
	else if (messageId == "sign-in")
	{
		OnSignInMessage(asyncId);
	}
	else if (messageId == "sign-in-silently")
	{
		OnSignInSilentlyMessage(asyncId);
	}
	else if (messageId == "update-achievement")
	{
		const std::string& achievementId = params[0].GetString();
		uint32_t percentComplete = static_cast<uint32_t>(params[1].GetNumber());

		OnUpdateAchievementMessage(achievementId, percentComplete, asyncId);
	}
	else if (messageId == "set-presence")
	{
		bool isUserActiveInTitle = params[0].GetBool();

		OnSetPresenceMessage(isUserActiveInTitle, asyncId);
	}
	else if (messageId == "title-storage-upload-blob")
	{
		// Unpack the parameters sent with this message
		const std::string& blobPath = params[0].GetString();
		title_storage_blob_type blobType = static_cast<title_storage_blob_type>(static_cast<int>(params[1].GetNumber()));
		title_storage_type storageType = static_cast<title_storage_type>(static_cast<int>(params[2].GetNumber()));
		bool isBase64 = params[3].GetBool();
		const std::string& blobDataStr = params[4].GetString();

		// Get the blob buffer for actual upload. When 'isBase64' is set the provided string must be base64
		// decoded to get the actual binary data. Otherwise just copy the string in to the buffer directly.
		std::shared_ptr<BlobBuffer> blobBuffer;
		if (isBase64)
		{
			std::string binaryDataStr = base64_decode(blobDataStr);
			blobBuffer.reset(new BlobBuffer(binaryDataStr.begin(), binaryDataStr.end()));
		}
		else
		{
			blobBuffer.reset(new BlobBuffer(blobDataStr.begin(), blobDataStr.end()));
		}

		OnTitleStorageUploadBlobMessage(blobPath, blobType, storageType, blobBuffer, asyncId);
	}
	else if (messageId == "title-storage-download-blob")
	{
		const std::string& blobPath = params[0].GetString();
		title_storage_blob_type blobType = static_cast<title_storage_blob_type>(static_cast<int>(params[1].GetNumber()));
		title_storage_type storageType = static_cast<title_storage_type>(static_cast<int>(params[2].GetNumber()));
		bool asBase64 = params[3].GetBool();

		OnTitleStorageDownloadBlobMessage(blobPath, blobType, storageType, asBase64, asyncId);
	}
	else if (messageId == "title-storage-delete-blob")
	{
		const std::string& blobPath = params[0].GetString();
		title_storage_blob_type blobType = static_cast<title_storage_blob_type>(static_cast<int>(params[1].GetNumber()));
		title_storage_type storageType = static_cast<title_storage_type>(static_cast<int>(params[2].GetNumber()));

		OnTitleStorageDeleteBlobMessage(blobPath, blobType, storageType, asyncId);
	}
}

void WrapperExtension::OnInitMessage(double asyncId)
{
	OutputDebugString(L"[Xbox] Init message\n");

	// Create Xbox Live user and context
	xblUser = std::make_shared<xbox::services::system::xbox_live_user>();
	xblContext = std::make_shared<xbox::services::xbox_live_context>(xblUser);

	// Add a sign out completed handler to detect if the user signs out
	xbox::services::system::xbox_live_user::add_sign_out_completed_handler(
	[this](const xbox::services::system::sign_out_completed_event_args& args)
	{
		this->OnSignOutCompleted(args.user());
	});

	// Send an OK response and send the sandbox if it is available.
	// The sandbox might only become available after signing in, so it is sent again there.
	SendAsyncResponse({
		{ "isOk",				true },
		{ "sandbox",			WideToUtf8(xblContext->application_config()->sandbox()) }
	}, asyncId);
}

void WrapperExtension::OnSignInMessage(double asyncId)
{
	OutputDebugString(L"[Xbox] Attempting sign in\n");

	// Attempt to sign in the user, which may show sign in UI.
	xblUser->signin(Windows::UI::Core::CoreWindow::GetForCurrentThread()->Dispatcher)
	.then([this, asyncId](xbox_live_result<sign_in_result> result)
	{
		HandleSignInResult(result, asyncId);
	}, concurrency::task_continuation_context::use_current());
}

void WrapperExtension::OnSignInSilentlyMessage(double asyncId)
{
	OutputDebugString(L"[Xbox] Attempting sign in silently\n");

	// Attempt to sign the user in silently, without showing UI.
	xblUser->signin_silently(Windows::UI::Core::CoreWindow::GetForCurrentThread()->Dispatcher)
	.then([this, asyncId](xbox_live_result<sign_in_result> result)
	{
		HandleSignInResult(result, asyncId);
	}, concurrency::task_continuation_context::use_current());
}

void WrapperExtension::HandleSignInResult(xbox_live_result<sign_in_result> result, double asyncId)
{
	// If there is no error and the sign in status is success, handle the result as a successful
	// sign in; otherwise treat it as a failed sign in. The other sign in statuses are
	// "user_interaction_required" (for a silent sign in that needs UI), or "user_cancel"
	// (from a standard sign in that showed UI). The status is always sent back to the Construct
	// plugin so it can expose these values to the Construct project.
	if (!result.err() && result.payload().status() == xbox::services::system::sign_in_status::success)
	{
		OutputDebugString(L"[Xbox] Sign in success\n");

		// Send an OK result, and also send all the values that only become available once signed in
		// (including the sandbox, which sometimes only becomes available once signed in).
		SendAsyncResponse({
			{ "isOk",				true },
			{ "status",				static_cast<double>(result.payload().status()) },
			{ "gamerTag",			WideToUtf8(xblUser->gamertag()) },
			{ "ageGroup",			WideToUtf8(xblUser->age_group()) },
			{ "privileges",			WideToUtf8(xblUser->privileges()) },
			{ "xboxUserId",			WideToUtf8(xblUser->xbox_user_id()) },
			{ "sandbox",			WideToUtf8(xblContext->application_config()->sandbox()) }
		}, asyncId);
	}
	else
	{
		OutputDebugString(L"[Xbox] Sign in failed\n");

		SendAsyncResponse({
			{ "isOk",				false },
			{ "status",				static_cast<double>(result.payload().status()) },
			{ "errorMessage",		result.err_message() }
		}, asyncId);
	}
}

void WrapperExtension::OnSignOutCompleted(xbox_live_user_t xboxLiveUser)
{
	OutputDebugString(L"[Xbox] Sign out completed\n");

	SendWebMessage("on-sign-out-completed", {});
}

void WrapperExtension::OnUpdateAchievementMessage(const std::string& achievementId, uint32_t percentComplete, double asyncId)
{
	OutputDebugString(L"[Xbox] Updating achievement\n");

	xblContext->achievement_service().update_achievement(xblUser->xbox_user_id(), Utf8ToWide(achievementId), percentComplete)
	.then([this, asyncId](xbox_live_result<void> result)
	{
		if (!result.err())		// success
		{
			OutputDebugString(L"[Xbox] Updated achievement OK\n");

			SendAsyncResponse({
				{ "isOk",				true }
			}, asyncId);
		}
		else					// error
		{
			OutputDebugString(L"[Xbox] Update achievement failed\n");

			SendAsyncResponse({
				{ "isOk",				false }
			}, asyncId);
		}
	}, concurrency::task_continuation_context::use_current());
}

void WrapperExtension::OnSetPresenceMessage(bool isUserActiveInTitle, double asyncId)
{
	OutputDebugString(L"[Xbox] Updating presence\n");

	xblContext->presence_service().set_presence(isUserActiveInTitle)
	.then([this, asyncId](xbox_live_result<void> result)
	{
		if (!result.err())		// success
		{
			OutputDebugString(L"[Xbox] Updated presence OK\n");

			SendAsyncResponse({
				{ "isOk",				true }
			}, asyncId);
		}
		else					// error
		{
			OutputDebugString(L"[Xbox] Update presence failed\n");

			SendAsyncResponse({
				{ "isOk",				false }
			}, asyncId);
		}
	}, concurrency::task_continuation_context::use_current());
}

void WrapperExtension::OnTitleStorageUploadBlobMessage(const std::string& blobPath, title_storage_blob_type blobType,
		title_storage_type storageType, std::shared_ptr<BlobBuffer> blobBuffer, double asyncId)
{
	OutputDebugString(L"[Xbox] Uploading blob to title storage\n");

	// Create metadata for the blob that is to be uploaded.
	title_storage_blob_metadata blobMeta(xblContext->application_config()->scid(), storageType, Utf8ToWide(blobPath), blobType, xblUser->xbox_user_id());

	// Start uploading the blob. Note that the callback lambda captures blobBuffer, which is a shared_ptr, to ensure
	// it stays alive until the upload completes, which the documentation for upload_blob advises.
	xblContext->title_storage_service().upload_blob(blobMeta, blobBuffer, title_storage_e_tag_match_condition::not_used)
	.then([this, blobBuffer, asyncId](xbox_live_result<title_storage_blob_metadata> result)
	{
		if (!result.err())		// success
		{
			OutputDebugString(L"[Xbox] Uploaded title storage blob OK\n");

			SendAsyncResponse({
				{ "isOk",				true }
			}, asyncId);
		}
		else					// error
		{
			OutputDebugString(L"[Xbox] Upload title storage blob failed\n");

			SendAsyncResponse({
				{ "isOk",				false }
			}, asyncId);
		}
	}, concurrency::task_continuation_context::use_current());
}

void WrapperExtension::OnTitleStorageDownloadBlobMessage(const std::string& blobPath, title_storage_blob_type blobType, title_storage_type storageType, bool asBase64, double asyncId)
{
	OutputDebugString(L"[Xbox] Downloading blob from title storage\n");

	// Create metadata for the blob that is to be downloaded, as download_blob() requires this.
	title_storage_blob_metadata blobMeta(xblContext->application_config()->scid(), storageType, Utf8ToWide(blobPath), blobType, xblUser->xbox_user_id());

	// Create blob buffer to receive the downloaded data.
	std::shared_ptr<BlobBuffer> blobBuffer = std::make_shared<BlobBuffer>();

	// NOTE: the blobBuffer parameter of download_blob() states the blobBuffer parameter "needs to be large enough to store
	// the blob being downloaded." and that "This method will throw ERROR_INSUFFICIENT_BUFFER (0x8007007A) if the blobBuffer
	// doesn't have enough capacity to hold the blob data." However in testing this does not appear to be the case: the passed
	// vector is automatically resized to fit the downloaded data. This is actually much more convenient than if the right size
	// buffer was required in advance of the call as the documentation states, since to get the size of the file to download in
	// advance, the only way seems to be via calling get_blob_metadata(); however in testing that fails if passed the path
	// to a specific file (returning 0 results). It appears to be an API designed for folder listing, returning all results
	// for a given folder-level path. This makes it harder to get the metadata for a single file as it would mean requesting
	// the entire folder contents and then looking for the right file in the results. Rather than go to all that trouble, this
	// code just relies on the undocumented behavior of resizing the blobBuffer vector to the correct size.
	xblContext->title_storage_service().download_blob(blobMeta, blobBuffer, title_storage_e_tag_match_condition::not_used)
	.then([this, asyncId, asBase64](xbox_live_result<title_storage_blob_result> result)
	{
		if (!result.err())		// success
		{
			OutputDebugString(L"[Xbox] Downloaded title storage blob OK\n");

			// Get the downloaded blob buffer, and then copy that data to a std::string.
			std::shared_ptr<BlobBuffer> blobBuffer = result.payload().blob_buffer();
			std::string blobDataStr(blobBuffer->begin(), blobBuffer->end());

			// If the caller requested the data to be base64 encoded (which it uses for binary data),
			// then convert the data string to send back in to base64 encoded form.
			if (asBase64)
				blobDataStr = base64_encode(blobDataStr);

			SendAsyncResponse({
				{ "isOk",				true },
				{ "data",				blobDataStr }
			}, asyncId);
		}
		else					// error
		{
			OutputDebugString(L"[Xbox] Download title storage blob failed\n");

			SendAsyncResponse({
				{ "isOk",				false }
			}, asyncId);
		}
	}, concurrency::task_continuation_context::use_current());
}

void WrapperExtension::OnTitleStorageDeleteBlobMessage(const std::string& blobPath, title_storage_blob_type blobType, title_storage_type storageType, double asyncId)
{
	OutputDebugString(L"[Xbox] Deleting blob from title storage\n");

	// Create metadata for the blob that is to be deleted, as delete_blob() requires this.
	title_storage_blob_metadata blobMeta(xblContext->application_config()->scid(), storageType, Utf8ToWide(blobPath), blobType, xblUser->xbox_user_id());

	xblContext->title_storage_service().delete_blob(blobMeta, false)
	.then([this, asyncId](xbox_live_result<void> result)
	{
		if (!result.err())		// success
		{
			OutputDebugString(L"[Xbox] Deleted title storage blob OK\n");

			SendAsyncResponse({
				{ "isOk",				true }
			}, asyncId);
		}
		else					// error
		{
			OutputDebugString(L"[Xbox] Deleting title storage blob failed\n");

			SendAsyncResponse({
				{ "isOk",				false }
			}, asyncId);
		}
	}, concurrency::task_continuation_context::use_current());
}
