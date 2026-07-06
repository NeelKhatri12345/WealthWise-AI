import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { bulkDeleteTransactionsThunk, bulkUpdateCategoryThunk, fetchTransactions } from "@/store/slices/transactionSlice";

export const TransactionsBulkActions: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedIds, categories } = useAppSelector((state) => state.transactions);

  const [isChangingCategory, setIsChangingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  if (selectedIds.length === 0) return null;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} transaction(s)?`)) {
      await dispatch(bulkDeleteTransactionsThunk(selectedIds));
      dispatch(fetchTransactions());
    }
  };

  const handleApplyCategory = async () => {
    if (!newCategory) return;
    await dispatch(bulkUpdateCategoryThunk({ transactionIds: selectedIds, category: newCategory }));
    setIsChangingCategory(false);
    setNewCategory("");
    dispatch(fetchTransactions());
  };

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-fade-in shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-primary-800">
          {selectedIds.length} transaction(s) selected
        </span>
        
        {isChangingCategory ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type category or select..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              list="bulk-category-list"
              className="text-sm border border-primary-300 rounded-md px-2 py-1 focus:ring-primary-500 w-48"
            />
            <datalist id="bulk-category-list">
              {categories.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            <button
              onClick={handleApplyCategory}
              disabled={!newCategory}
              className="px-3 py-1 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={() => setIsChangingCategory(false)}
              className="px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsChangingCategory(true)}
              className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-100 transition-colors"
            >
              Change Category
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-medium text-wealth-danger bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
