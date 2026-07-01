import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Button } from "@/components/ui";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number (e.g. +1234567890)")
    .or(z.literal(""))
    .optional(),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  defaultValues: ProfileFormValues;
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  isLoading?: boolean;
}

export const ProfileForm = ({
  defaultValues,
  onSubmit,
  isLoading = false,
}: ProfileFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  return (
    <Card className="border border-wealth-border bg-wealth-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Edit Profile</CardTitle>
        <CardDescription>Update your personal information details</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            error={errors.name?.message}
            {...register("name")}
            placeholder="Your full name"
            disabled={isLoading}
          />

          <Input
            label="Email Address"
            type="email"
            error={errors.email?.message}
            {...register("email")}
            placeholder="email@example.com"
            disabled={true}
            helperText="Your account email address cannot be changed."
          />

          <Input
            label="Phone Number"
            type="tel"
            error={errors.phone?.message}
            {...register("phone")}
            placeholder="Optional"
            disabled={isLoading}
          />

          <Input
            label="Bio"
            error={errors.bio?.message}
            {...register("bio")}
            placeholder="Tell us about yourself... (Local only)"
            disabled={isLoading}
            helperText="Maximum of 200 characters."
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-gray-50 border-t border-wealth-border">
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading || !isDirty}
            variant="primary"
          >
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
