import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function PortfolioPage() {
  useDocumentTitle("Portfolio");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Portfolio Recommendations"
        description="AI-powered investment suggestions based on your profile"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">
          Portfolio recommendations placeholder
        </p>
      </div>
    </div>
  );
}
