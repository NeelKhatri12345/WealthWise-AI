import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ProfilePage as ProfileFeature } from "@/features/profile";

export default function ProfilePage() {
  useDocumentTitle("Profile");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profile"
        description="Manage your personal information and security settings"
      />
      <ProfileFeature />
    </div>
  );
}
