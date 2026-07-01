import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function HealthScorePage() {
  useDocumentTitle("Financial Health Score");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Financial Health Score"
        description="Your comprehensive financial wellness assessment"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">
          Health score dashboard placeholder
        </p>
      </div>
    </div>
  );
}
