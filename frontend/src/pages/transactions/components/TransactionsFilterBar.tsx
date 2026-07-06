import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setFilters, resetFilters, fetchCategories } from "@/store/slices/transactionSlice";

export const TransactionsFilterBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { filters, categories } = useAppSelector((state) => state.transactions);

  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localAmountMin, setLocalAmountMin] = useState(filters.amountMin === null ? "" : filters.amountMin.toString());
  const [localAmountMax, setLocalAmountMax] = useState(filters.amountMax === null ? "" : filters.amountMax.toString());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        dispatch(setFilters({ search: localSearch }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, dispatch, filters.search]);

  // Debounce amount inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = localAmountMin ? parseFloat(localAmountMin) : null;
      const max = localAmountMax ? parseFloat(localAmountMax) : null;
      if (min !== filters.amountMin || max !== filters.amountMax) {
        dispatch(setFilters({ amountMin: min, amountMax: max }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localAmountMin, localAmountMax, dispatch, filters.amountMin, filters.amountMax]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleReset = () => {
    setLocalSearch("");
    setLocalAmountMin("");
    setLocalAmountMax("");
    dispatch(resetFilters());
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-wealth-border mb-6 space-y-4 shadow-sm">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Search</label>
          <input
            type="text"
            placeholder="Search merchant or description..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Date Range */}
        <div className="w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => dispatch(setFilters({ dateFrom: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => dispatch(setFilters({ dateTo: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Type */}
        <div className="w-[120px]">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Type</label>
          <select
            value={filters.type}
            onChange={(e) => dispatch(setFilters({ type: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        {/* Category */}
        <div className="w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Category</label>
          <select
            value={filters.category}
            onChange={(e) => dispatch(setFilters({ category: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Range */}
        <div className="flex items-center gap-2">
          <div className="w-[100px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Min ₹</label>
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={localAmountMin}
              onChange={(e) => setLocalAmountMin(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="w-[100px]">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Max ₹</label>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={localAmountMax}
              onChange={(e) => setLocalAmountMax(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors h-[38px]"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
