import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AdminAuditTable } from "./components/AdminAuditTable";

export default function AdminAuditPage() {
  useDocumentTitle("Admin Audit Logs");

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Admin Audit Logs"
        description="Track administrator actions across the platform"
      />
      <AdminAuditTable />
    </div>
  );
}
