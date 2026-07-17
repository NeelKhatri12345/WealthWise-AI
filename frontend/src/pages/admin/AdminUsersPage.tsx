import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AdminUsersPage() {
  useDocumentTitle("Manage Users");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        description="View and manage registered users"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">
          User management table placeholder
        </p>
      </div>
    </div>
  );
}
