interface AuditDetailProps {
  entry: {
    id: string;
    action: string;
    user: string;
    resource: string;
    timestamp: string;
    ipAddress?: string;
    status: "success" | "failure";
    details?: Record<string, unknown>;
    userAgent?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetail = ({ entry, isOpen, onClose }: AuditDetailProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Audit Log Detail
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">ID</span>
            <span className="text-sm font-mono text-gray-900">{entry.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Action</span>
            <span className="text-sm font-medium text-gray-900">
              {entry.action}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">User</span>
            <span className="text-sm text-gray-900">{entry.user}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Resource</span>
            <span className="text-sm font-mono text-gray-900">
              {entry.resource}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Timestamp</span>
            <span className="text-sm text-gray-900">{entry.timestamp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entry.status === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {entry.status}
            </span>
          </div>
          {entry.ipAddress && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">IP Address</span>
              <span className="text-sm font-mono text-gray-900">
                {entry.ipAddress}
              </span>
            </div>
          )}
          {entry.userAgent && (
            <div>
              <span className="text-sm text-gray-500">User Agent</span>
              <p className="mt-1 text-xs text-gray-700 break-all">
                {entry.userAgent}
              </p>
            </div>
          )}
          {entry.details && (
            <div>
              <span className="text-sm text-gray-500">Details</span>
              <pre className="mt-1 rounded bg-gray-100 p-2 text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
