import { useState } from "react";
import { AuditTable, AuditFilters, AuditDetail } from "./components";
import { useAuditLogs } from "./hooks";

export const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const { entries, totalPages, isLoading } = useAuditLogs(page, filters);
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track all system actions and user activity
        </p>
      </div>

      <AuditFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <AuditTable
          entries={entries}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEntryClick={setSelectedEntryId}
        />
      )}

      {selectedEntry && (
        <AuditDetail
          entry={selectedEntry}
          isOpen={!!selectedEntryId}
          onClose={() => setSelectedEntryId(null)}
        />
      )}
    </div>
  );
};
