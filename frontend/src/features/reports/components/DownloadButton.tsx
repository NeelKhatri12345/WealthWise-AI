interface DownloadButtonProps {
  onDownloadPDF?: () => void;
  onDownloadCSV?: () => void;
  isLoading?: boolean;
}

export const DownloadButton = ({
  onDownloadPDF,
  onDownloadCSV,
  isLoading = false,
}: DownloadButtonProps) => {
  return (
    <div className="flex items-center gap-2">
      {onDownloadPDF && (
        <button
          onClick={onDownloadPDF}
          disabled={isLoading}
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {isLoading ? "Exporting..." : "Export PDF"}
        </button>
      )}
      {onDownloadCSV && (
        <button
          onClick={onDownloadCSV}
          disabled={isLoading}
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
          {isLoading ? "Exporting..." : "Export CSV"}
        </button>
      )}
    </div>
  );
};
