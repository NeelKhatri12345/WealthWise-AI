import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function UploadPage() {
  useDocumentTitle("Upload Statements");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Upload Statements"
        description="Upload your bank or credit card statements for analysis"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">File upload area placeholder</p>
      </div>
    </div>
  );
}
