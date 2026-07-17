import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AICoachPage() {
  useDocumentTitle("AI Financial Coach");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI Financial Coach"
        description="Get personalized financial advice from your AI assistant"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">
          AI chat interface placeholder
        </p>
      </div>
    </div>
  );
}
