import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAppDispatch } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, logout, deleteAccount } from "@/store/slices/authSlice";
import { authService, type CurrentUserResponse } from "@/services/auth.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/routes/routes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  Button,
  Input,
  Modal,
} from "@/components/ui";

function formatCreatedDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export default function ProfilePage() {
  useDocumentTitle("Profile");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullProfile, setFullProfile] = useState<CurrentUserResponse | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const currentPasswordInputRef = useRef<HTMLInputElement>(null);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const confirmNewPasswordInputRef = useRef<HTMLInputElement>(null);

  // Initial fetch and sync
  useEffect(() => {
    if (user) {
      setFullName(`${user.firstName} ${user.lastName}`.trim());
      setPhone(user.phone ?? "");
    }

    authService
      .getCurrentUser()
      .then((res) => {
        setFullProfile(res);
        setFullName(res.full_name);
        setPhone(res.phone ?? "");
      })
      .catch((err) => {
        console.error("Failed to load user profile", err);
      });
  }, [user]);

  const handleStartEdit = () => {
    setEditMode(true);
    // Focus the name field in the next tick
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (fullProfile) {
      setFullName(fullProfile.full_name);
      setPhone(fullProfile.phone ?? "");
    } else if (user) {
      setFullName(`${user.firstName} ${user.lastName}`.trim());
      setPhone(user.phone ?? "");
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    const result = await dispatch(
      updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      })
    );

    setSavingProfile(false);
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Profile updated successfully");
      setEditMode(false);
      // Refresh the full profile fields
      try {
        const updated = await authService.getCurrentUser();
        setFullProfile(updated);
      } catch (err) {
        console.error("Failed to refresh profile", err);
      }
    } else {
      const errorMsg = (result.payload as string) ?? "Failed to update profile";
      toast.error(errorMsg);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();

    // Fallback to ref values to support browser autofill without onChange triggers
    const currentVal = currentPassword || currentPasswordInputRef.current?.value || "";
    const newVal = newPassword || newPasswordInputRef.current?.value || "";
    const confirmVal = confirmNewPassword || confirmNewPasswordInputRef.current?.value || "";

    if (!currentVal) {
      toast.error("Current password is required");
      return;
    }
    if (newVal.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }
    if (newVal !== confirmVal) {
      toast.error("Confirm password does not match new password");
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        current_password: currentVal,
        new_password: newVal,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      if (currentPasswordInputRef.current) currentPasswordInputRef.current.value = "";
      if (newPasswordInputRef.current) newPasswordInputRef.current.value = "";
      if (confirmNewPasswordInputRef.current) confirmNewPasswordInputRef.current.value = "";
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to update password";
      toast.error(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await dispatch(logout());
    setLoggingOut(false);
    navigate(ROUTES.LOGIN);
  };

  const handleOpenDeleteModal = () => {
    setDeleteConfirmationText("");
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (deletingAccount) return;
    setIsDeleteModalOpen(false);
    setDeleteConfirmationText("");
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationText !== "DELETE") return;
    setDeletingAccount(true);
    const result = await dispatch(deleteAccount());
    setDeletingAccount(false);
    if (deleteAccount.fulfilled.match(result)) {
      toast.success("Your account has been permanently deleted.");
      navigate(ROUTES.LOGIN);
    } else {
      const errorMsg = (result.payload as string) ?? "Failed to delete account";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information and security settings"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Main Profile & Forms) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <Avatar
                  src={user?.avatar}
                  name={user ? `${user.firstName} ${user.lastName}` : undefined}
                  size="lg"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                  </h2>
                  <p className="text-sm text-wealth-muted">{user?.email}</p>
                </div>
              </div>
              {!editMode && (
                <Button variant="outline" onClick={handleStartEdit}>
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Personal Information Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal name and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editMode}
                  ref={nameInputRef}
                />
                
                <Input
                  label="Email Address"
                  value={user?.email ?? ""}
                  disabled
                  helperText="Registered email address cannot be changed."
                />

                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editMode}
                  placeholder="e.g. +919876543210"
                />

                {editMode && (
                  <div className="flex gap-3 pt-2">
                    <Button variant="primary" type="submit" isLoading={savingProfile}>
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={savingProfile}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-wealth-danger">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and critical account actions
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
              <div className="flex items-center justify-between border-b border-wealth-border pb-6">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sign Out</p>
                  <p className="text-xs text-wealth-muted">Log out of your current session</p>
                </div>
                <Button variant="danger" onClick={handleLogout} isLoading={loggingOut}>
                  Logout
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Delete Account</p>
                  <p className="text-xs text-wealth-muted">Permanently delete your account and all associated data</p>
                </div>
                <Button variant="danger" onClick={handleOpenDeleteModal}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Status & Password) */}
        <div className="space-y-6">
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Details about your account registration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fullProfile?.created_at && (
                <div className="flex justify-between border-b border-wealth-border pb-2 text-sm">
                  <span className="font-medium text-wealth-muted">Registered On</span>
                  <span className="text-gray-900">{formatCreatedDate(fullProfile.created_at)}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-wealth-border pb-2 text-sm">
                <span className="font-medium text-wealth-muted">Account Status</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-wealth-success ring-1 ring-inset ring-green-600/20">
                  {fullProfile?.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between pb-2 text-sm">
                <span className="font-medium text-wealth-muted">Email Verification</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    fullProfile?.is_verified
                      ? "bg-green-50 text-wealth-success ring-green-600/20"
                      : "bg-amber-50 text-amber-600 ring-amber-600/20"
                  }`}
                >
                  {fullProfile?.is_verified ? "Verified" : "Pending"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is using a strong password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  name="current_password"
                  id="current_password"
                  autoComplete="current-password"
                  ref={currentPasswordInputRef}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <Input
                  label="New Password"
                  type="password"
                  name="new_password"
                  id="new_password"
                  autoComplete="new-password"
                  ref={newPasswordInputRef}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  helperText="At least 8 characters, one uppercase, one digit."
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirm_new_password"
                  id="confirm_new_password"
                  autoComplete="new-password"
                  ref={confirmNewPasswordInputRef}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                />

                <div className="pt-2">
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full"
                    isLoading={changingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="⚠ Delete Account"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-red-600">
            This action is permanent.
          </p>
          <div className="text-sm text-wealth-muted space-y-1">
            <p>Deleting your account will permanently remove:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Profile</li>
              <li>Uploaded statements</li>
              <li>Financial Profile</li>
              <li>Health Scores</li>
              <li>Ask AI conversations</li>
              <li>Dashboard data</li>
              <li>Any other user-owned records</li>
            </ul>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            This action cannot be undone.
          </p>
          <div className="space-y-2">
            <label htmlFor="confirm-delete" className="block text-xs font-medium text-wealth-muted">
              Type <span className="font-bold text-gray-900 select-all">DELETE</span> to continue.
            </label>
            <Input
              id="confirm-delete"
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-wealth-border">
            <Button variant="outline" onClick={handleCloseDeleteModal} disabled={deletingAccount}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmationText !== "DELETE"}
              onClick={handleConfirmDelete}
              isLoading={deletingAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
