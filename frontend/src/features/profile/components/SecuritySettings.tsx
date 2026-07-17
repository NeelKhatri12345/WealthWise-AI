import { useState } from "react";

interface SecuritySettingsProps {
  twoFactorEnabled: boolean;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  onToggle2FA: (enabled: boolean) => Promise<void>;
}

export const SecuritySettings = ({
  twoFactorEnabled,
  onChangePassword,
  onToggle2FA,
}: SecuritySettingsProps) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    await onChangePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Security</h3>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Password</p>
              <p className="text-xs text-gray-500">
                Change your account password
              </p>
            </div>
            <button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isChangingPassword ? "Cancel" : "Change"}
            </button>
          </div>

          {isChangingPassword && (
            <div className="mt-4 space-y-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={handlePasswordChange}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Update Password
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Two-Factor Authentication
            </p>
            <p className="text-xs text-gray-500">
              {twoFactorEnabled
                ? "Enabled - extra security active"
                : "Add an extra layer of security"}
            </p>
          </div>
          <button
            onClick={() => onToggle2FA(!twoFactorEnabled)}
            className={`h-6 w-10 rounded-full transition-colors ${twoFactorEnabled ? "bg-indigo-600" : "bg-gray-300"}`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${twoFactorEnabled ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
