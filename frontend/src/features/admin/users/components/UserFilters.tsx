interface UserFiltersState {
  role?: string;
  status?: string;
  search?: string;
}

interface UserFiltersProps {
  filters: UserFiltersState;
  onFilterChange: (filters: UserFiltersState) => void;
  onReset: () => void;
}

export const UserFilters = ({
  filters,
  onFilterChange,
  onReset,
}: UserFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Search
        </label>
        <input
          type="text"
          value={filters.search ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Role
        </label>
        <select
          value={filters.role ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, role: e.target.value || undefined })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Status
        </label>
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value || undefined })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <button
        onClick={onReset}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Reset
      </button>
    </div>
  );
};
