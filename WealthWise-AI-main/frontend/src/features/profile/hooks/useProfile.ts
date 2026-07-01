import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store";
import { fetchCurrentUser } from "@/store/slices/authSlice";
import { userApi } from "@/services/api/user.api";

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  memberSince: string;
  twoFactorEnabled: boolean;
  roleName: string;
  isVerified: boolean;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  toggle2FA: (enabled: boolean) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearStatus: () => void;
}

export const useProfile = (): UseProfileReturn => {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.getProfile();
      const formattedDate = new Date(data.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      setProfile({
        name: data.full_name,
        email: data.email,
        phone: data.phone ?? "",
        bio: "", // Local placeholder as backend user model does not support bio
        avatarUrl: "",
        memberSince: formattedDate,
        twoFactorEnabled: false,
        roleName: data.role_name,
        isVerified: data.is_verified,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err.message ??
          "Failed to load profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await userApi.updateProfile({
        full_name: data.name,
        phone: data.phone,
      });

      const formattedDate = new Date(updated.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      setProfile((prev) => ({
        name: updated.full_name,
        email: updated.email,
        phone: updated.phone ?? "",
        bio: data.bio ?? prev?.bio ?? "",
        avatarUrl: "",
        memberSince: formattedDate,
        twoFactorEnabled: false,
        roleName: updated.role_name,
        isVerified: updated.is_verified,
      }));

      // Refresh global Redux auth state so header/sidebar updates automatically
      await dispatch(fetchCurrentUser()).unwrap();
      setSuccessMessage("Profile updated successfully");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err.message ??
          "Failed to update profile"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await userApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccessMessage("Password changed successfully");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err.message ??
          "Failed to change password"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggle2FA = async (_enabled: boolean) => {
    setSuccessMessage(null);
    setError("Two-Factor Authentication configuration is managed by system administrators.");
  };

  const deleteAccount = async () => {
    setSuccessMessage(null);
    setError(
      "Self-service account deletion is disabled. Please contact WealthWise AI support to delete your account."
    );
  };

  const clearStatus = () => {
    setError(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    successMessage,
    updateProfile,
    changePassword,
    toggle2FA,
    deleteAccount,
    clearStatus,
  };
};
