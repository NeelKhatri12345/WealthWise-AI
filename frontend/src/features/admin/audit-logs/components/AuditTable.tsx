interface AuditEntry {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
  ipAddress?: string;
  status: 'success' | 'failure';
}

interface AuditTableProps {
  entries: AuditEntry[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEntryClick?: (id: string) => void;
}

export const AuditTable = ({ entries, currentPage, totalPages, onPageChange, onEntryClick }: AuditTableProps) => {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No audit logs found</td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => onEntryClick?.(entry.id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 text-gray-500 text-xs">{entry.timestamp}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{entry.user}</td>
                  <td className="px-6 py-3 text-gray-700">{entry.action}</td>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{entry.resource}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
