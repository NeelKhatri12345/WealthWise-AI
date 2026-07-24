import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AdminActivityTable } from "./components/AdminActivityTable";

export default function AdminActivityPage() {
  useDocumentTitle("Activity Logs");

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Track user actions across the platform"
      />
      <AdminActivityTable />
    </div>
  );
}
