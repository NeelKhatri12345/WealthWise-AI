import { useEffect } from "react";
import { useAppSelector } from "@/store";
import {
  ProfileHeader,
  ProfileForm,
  SecuritySettings,
  AccountDeletion,
  PersonalInfoCard,
  AccountInfoCard,
} from "./components";
import { useProfile } from "./hooks";
import { Alert, Spinner } from "@/components/ui";

export const ProfilePage = () => {
  // Use auth.user from Redux where possible (to reflect global auth updates)
  const reduxUser = useAppSelector((state) => state.auth.user);

  const {
    profile,
    isLoading,
    error,
    successMessage,
    updateProfile,
    changePassword,
    toggle2FA,
    deleteAccount,
    clearStatus,
  } = useProfile();

  // Automatically clear success/error notifications after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        clearStatus();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (isLoading && !profile) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Fallback to reduxUser if profile state loading fails or is empty
  const displayName = profile?.name || reduxUser?.fullName || "";
  const displayEmail = profile?.email || reduxUser?.email || "";
  const displayPhone = profile?.phone || reduxUser?.phone || "";
  const displayRole = profile?.roleName || reduxUser?.role || "User";
  const displayId = reduxUser?.id || "";
  const isVerified = profile?.isVerified ?? reduxUser?.isVerified ?? false;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Alert Banner Container */}
      <div className="space-y-3">
        {error && (
          <Alert variant="error" onClose={clearStatus} title="Error">
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" onClose={clearStatus} title="Success">
            {successMessage}
          </Alert>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Read-Only Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Header */}
          <ProfileHeader
            name={displayName}
            email={displayEmail}
            avatarUrl={profile?.avatarUrl}
            memberSince={profile?.memberSince}
          />

          {/* Personal Info Display */}
          <PersonalInfoCard
            name={displayName}
            email={displayEmail}
            phone={displayPhone}
            roleName={displayRole}
          />

          {/* Account Details Metadata */}
          <AccountInfoCard
            userId={displayId}
            memberSince={profile?.memberSince || "N/A"}
            isVerified={isVerified}
            isActive={true}
          />
        </div>

        {/* Right Column: Interactive Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit Profile Form */}
          <ProfileForm
            defaultValues={{
              name: displayName,
              email: displayEmail,
              phone: displayPhone,
              bio: profile?.bio || "",
            }}
            onSubmit={updateProfile}
            isLoading={isLoading}
          />

          {/* Security Card (Password & 2FA) */}
          <SecuritySettings
            twoFactorEnabled={profile?.twoFactorEnabled ?? false}
            onChangePassword={changePassword}
            onToggle2FA={toggle2FA}
          />

          {/* Danger Zone Card */}
          <AccountDeletion onDelete={deleteAccount} />
        </div>
      </div>
    </div>
  );
};
