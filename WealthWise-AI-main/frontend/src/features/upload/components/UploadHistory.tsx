interface UploadRecord {
  id: string;
  fileName: string;
  uploadDate: string;
  status: "completed" | "processing" | "failed";
  transactionCount?: number;
}

interface UploadHistoryProps {
  uploads: UploadRecord[];
  onRetry?: (id: string) => void;
}

export const UploadHistory = ({ uploads, onRetry }: UploadHistoryProps) => {
  const statusBadge = (status: UploadRecord["status"]) => {
    const styles = {
      completed: "bg-green-100 text-green-700",
      processing: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload History</h3>
      </div>

      {uploads.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">
          No previous uploads
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center justify-between px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {upload.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {upload.uploadDate}
                  {upload.transactionCount !== undefined && (
                    <> &middot; {upload.transactionCount} transactions</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(upload.status)}
                {upload.status === "failed" && onRetry && (
                  <button
                    onClick={() => onRetry(upload.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
