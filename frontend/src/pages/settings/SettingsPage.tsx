import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function SettingsPage() {
  useDocumentTitle("Settings");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Configure your account preferences"
      />
      <div className="card">
        <p className="text-sm text-wealth-muted">Settings panel placeholder</p>
      </div>
    </div>
  );
}
