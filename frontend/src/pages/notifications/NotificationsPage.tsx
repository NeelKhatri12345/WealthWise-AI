import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotificationsPage() {
  useDocumentTitle("Notifications");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        description="Stay updated with your financial alerts"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">Notifications list placeholder</p>
      </div>
    </div>
  );
}
