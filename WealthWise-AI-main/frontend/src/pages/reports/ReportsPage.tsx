import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ReportsPage() {
  useDocumentTitle("Reports");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="Generate and download financial reports"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">Reports list placeholder</p>
      </div>
    </div>
  );
}
