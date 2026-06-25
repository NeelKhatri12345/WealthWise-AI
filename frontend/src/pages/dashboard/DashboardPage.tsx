import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of your financial health"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat cards and widgets will be implemented here */}
        <div className="card">
          <p className="text-sm text-wealth-muted">Dashboard content placeholder</p>
        </div>
      </div>
    </div>
  );
}
