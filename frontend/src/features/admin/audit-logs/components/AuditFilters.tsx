interface AuditFiltersState {
  action?: string;
  user?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'all' | 'success' | 'failure';
}

interface AuditFiltersProps {
  filters: AuditFiltersState;
  onFilterChange: (filters: AuditFiltersState) => void;
  onReset: () => void;
}

export const AuditFilters = ({ filters, onFilterChange, onReset }: AuditFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">User</label>
        <input
          type="text"
          value={filters.user ?? ''}
          onChange={(e) => onFilterChange({ ...filters, user: e.target.value || undefined })}
          placeholder="Filter by user..."
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
        <select
          value={filters.action ?? ''}
          onChange={(e) => onFilterChange({ ...filters, action: e.target.value || undefined })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="upload">Upload</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <select
          value={filters.status ?? 'all'}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as AuditFiltersState['status'] })}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      <button onClick={onReset} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        Reset
      </button>
    </div>
  );
};
