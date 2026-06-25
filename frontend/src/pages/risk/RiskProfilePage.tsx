import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function RiskProfilePage() {
  useDocumentTitle("Risk Profile");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Risk Profile"
        description="Understand your financial risk tolerance and exposure"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">Risk profile assessment placeholder</p>
      </div>
    </div>
  );
}
