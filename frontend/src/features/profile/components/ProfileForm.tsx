import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  bio: z.string().max(200, "Bio must be 200 characters or less").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  defaultValues: ProfileFormValues;
  onSubmit: (data: ProfileFormValues) => void;
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl bg-white p-6 shadow-sm border border-gray-100"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Edit Profile</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            {...register("name")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            {...register("phone")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            {...register("bio")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Tell us about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isDirty}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};
