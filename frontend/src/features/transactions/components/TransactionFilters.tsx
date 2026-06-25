interface TransactionFiltersState {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: 'all' | 'credit' | 'debit';
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  categories: string[];
  onFilterChange: (filters: TransactionFiltersState) => void;
  onReset: () => void;
}

export const TransactionFilters = ({
  filters,
  categories,
  onFilterChange,
  onReset,
}: TransactionFiltersProps) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-end gap-4">
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={filters.category ?? ''}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value || undefined })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={filters.type ?? 'all'}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value as TransactionFiltersState['type'] })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="credit">Income</option>
            <option value="debit">Expense</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
