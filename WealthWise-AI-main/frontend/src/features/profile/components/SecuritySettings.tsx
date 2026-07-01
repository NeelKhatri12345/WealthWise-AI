import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from "@/components/ui";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface SecuritySettingsProps {
  twoFactorEnabled: boolean;
  onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  onToggle2FA: (enabled: boolean) => Promise<void>;
}

export const SecuritySettings = ({
  twoFactorEnabled,
  onChangePassword,
  onToggle2FA,
}: SecuritySettingsProps) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordSubmit = async (data: ChangePasswordFormValues) => {
    setIsSubmitLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await onChangePassword(data.currentPassword, data.newPassword);
      setFormSuccess("Password changed successfully");
      reset();
      setIsChangingPassword(false);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err.message ??
          "Failed to change password"
      );
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <Card className="border border-wealth-border bg-wealth-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Security Settings</CardTitle>
        <CardDescription>Manage your passwords and two-factor authentication</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Account Password</p>
              <p className="text-xs text-wealth-muted">
                Regularly updating your password increases your account's security.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                setFormError(null);
                setFormSuccess(null);
              }}
            >
              {isChangingPassword ? "Cancel" : "Change Password"}
            </Button>
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}
          {formSuccess && <Alert variant="success">{formSuccess}</Alert>}

          {isChangingPassword && (
            <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4 pt-2">
              <Input
                label="Current Password"
                type="password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
                placeholder="Enter current password"
                disabled={isSubmitLoading}
              />
              <Input
                label="New Password"
                type="password"
                error={errors.newPassword?.message}
                {...register("newPassword")}
                placeholder="Enter new password"
                disabled={isSubmitLoading}
                helperText="Must be at least 8 characters, with 1 uppercase, 1 digit, and 1 special character."
              />
              <Input
                label="Confirm New Password"
                type="password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
                placeholder="Confirm new password"
                disabled={isSubmitLoading}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isSubmitLoading} variant="primary">
                  Update Password
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* 2FA Section */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div className="max-w-[70%]">
            <p className="text-sm font-semibold text-gray-900">
              Two-Factor Authentication (2FA)
            </p>
            <p className="text-xs text-wealth-muted mt-0.5">
              Secure your account by adding an extra validation layer (handled by system admins).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggle2FA(!twoFactorEnabled)}
            className={`h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              twoFactorEnabled ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                twoFactorEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
