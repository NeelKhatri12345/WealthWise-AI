interface ReportFiltersState {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ReportFiltersProps {
  filters: ReportFiltersState;
  onFilterChange: (filters: ReportFiltersState) => void;
  onReset: () => void;
}

export const ReportFilters = ({
  filters,
  onFilterChange,
  onReset,
}: ReportFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Report Type
        </label>
        <select
          value={filters.type ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, type: e.target.value || undefined })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          From
        </label>
        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, dateFrom: e.target.value })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          To
        </label>
        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) =>
            onFilterChange({ ...filters, dateTo: e.target.value })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
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
