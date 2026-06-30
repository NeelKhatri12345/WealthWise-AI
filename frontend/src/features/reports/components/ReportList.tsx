interface Report {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  generatedAt: string;
  status: "ready" | "generating" | "failed";
}

interface ReportListProps {
  reports: Report[];
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export const ReportList = ({
  reports,
  onView,
  onDownload,
}: ReportListProps) => {
  const statusStyles = {
    ready: "bg-green-100 text-green-700",
    generating: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
      </div>

      {reports.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">
          No reports generated yet
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {report.name}
                </p>
                <p className="text-xs text-gray-500">
                  {report.type} &middot; {report.dateRange} &middot;{" "}
                  {report.generatedAt}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[report.status]}`}
                >
                  {report.status.charAt(0).toUpperCase() +
                    report.status.slice(1)}
                </span>
                {report.status === "ready" && (
                  <div className="flex gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(report.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        View
                      </button>
                    )}
                    {onDownload && (
                      <button
                        onClick={() => onDownload(report.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                      >
                        Download
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
