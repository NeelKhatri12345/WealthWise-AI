import {
  ProfileHeader,
  ProfileForm,
  SecuritySettings,
  AccountDeletion,
} from "./components";
import { useProfile } from "./hooks";

export const ProfilePage = () => {
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    changePassword,
    toggle2FA,
    deleteAccount,
  } = useProfile();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error ?? "Failed to load profile"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings
        </p>
      </div>

      <ProfileHeader
        name={profile.name}
        email={profile.email}
        avatarUrl={profile.avatarUrl}
        memberSince={profile.memberSince}
      />

      <ProfileForm
        defaultValues={{
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
        }}
        onSubmit={updateProfile}
      />

      <SecuritySettings
        twoFactorEnabled={profile.twoFactorEnabled}
        onChangePassword={changePassword}
        onToggle2FA={toggle2FA}
      />

      <AccountDeletion onDelete={deleteAccount} />
    </div>
  );
};
