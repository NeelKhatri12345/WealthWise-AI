import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AdminDashboardPage() {
  useDocumentTitle("Admin Dashboard");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        description="System overview and management"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">Admin stats placeholder</p>
      </div>
    </div>
  );
}
