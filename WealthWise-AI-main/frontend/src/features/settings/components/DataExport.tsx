interface DataExportProps {
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  isExporting?: boolean;
  lastExportDate?: string;
}

export const DataExport = ({
  onExportJSON,
  onExportCSV,
  isExporting = false,
  lastExportDate,
}: DataExportProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Export Your Data
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        Download a copy of all your data including transactions, scores, and
        settings.
      </p>

      {lastExportDate && (
        <p className="mb-4 text-xs text-gray-400">
          Last export: {lastExportDate}
        </p>
      )}

      <div className="flex gap-3">
        {onExportJSON && (
          <button
            onClick={onExportJSON}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? "Exporting..." : "Export JSON"}
          </button>
        )}
        {onExportCSV && (
          <button
            onClick={onExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        )}
      </div>
    </div>
  );
};
