import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function TransactionsPage() {
  useDocumentTitle("Transactions");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transactions"
        description="View and manage your categorized transactions"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">
          Transaction table placeholder
        </p>
      </div>
    </div>
  );
}
