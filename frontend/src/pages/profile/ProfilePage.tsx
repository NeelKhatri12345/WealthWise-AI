import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ProfilePage() {
  useDocumentTitle("Profile");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profile"
        description="Manage your personal information"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">Profile form placeholder</p>
      </div>
    </div>
  );
}
