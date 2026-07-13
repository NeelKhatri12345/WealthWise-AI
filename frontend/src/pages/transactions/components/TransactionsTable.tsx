import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { Badge } from "@/components/ui/Badge";
import {
  setFilters,
  setPage,
  toggleSelection,
  selectAll,
  deleteTransactionThunk,
  updateTransactionThunk,
  fetchTransactions,
} from "@/store/slices/transactionSlice";
import type { Transaction } from "@/store/slices/transactionSlice";

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const AMOUNT_MASK = "₹••••••";

export const TransactionsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { transactions, pagination, filters, selectedIds, loading } = useAppSelector(
    (state) => state.transactions,
  );
  const [amountsVisible, setAmountsVisible] = useState(false);

  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSort = (col: string) => {
    if (filters.sortBy === col) {
      dispatch(
        setFilters({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" }),
      );
    } else {
      dispatch(setFilters({ sortBy: col, sortOrder: "desc" }));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await dispatch(deleteTransactionThunk(id)).unwrap();
        dispatch(fetchTransactions());
      } catch (err) {
        window.alert(typeof err === "string" ? err : "Failed to delete transaction");
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTxn) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await dispatch(
        updateTransactionThunk({ id: editingTxn.id, data: editingTxn }),
      ).unwrap();
      setEditingTxn(null);
      dispatch(fetchTransactions());
    } catch (err) {
      setEditError(typeof err === "string" ? err : "Failed to update transaction");
    } finally {
      setSavingEdit(false);
    }
  };

  const allSelected =
    transactions.length > 0 && selectedIds.length === transactions.length;

  return (
    <div className="flex flex-col h-full relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-wealth-border flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-wealth-border text-wealth-muted uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => dispatch(selectAll(e.target.checked))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("date")}
              >
                Date {filters.sortBy === "date" && (filters.sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("merchant")}
              >
                Merchant{" "}
                {filters.sortBy === "merchant" && (filters.sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("category")}
              >
                Category{" "}
                {filters.sortBy === "category" && (filters.sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("amount")}
                  >
                    Amount{" "}
                    {filters.sortBy === "amount" && (filters.sortOrder === "asc" ? "↑" : "↓")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmountsVisible((v) => !v)}
                    className="text-gray-400 hover:text-gray-700 transition-colors normal-case"
                    aria-label={amountsVisible ? "Hide amounts" : "Show amounts"}
                    title={amountsVisible ? "Hide amounts" : "Show amounts"}
                  >
                    {amountsVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-center"
                onClick={() => handleSort("type")}
              >
                Type {filters.sortBy === "type" && (filters.sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wealth-border">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-wealth-muted">
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(txn.id)}
                      onChange={() => dispatch(toggleSelection(txn.id))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{txn.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {txn.merchant || txn.description}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{txn.category || "—"}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      txn.type === "credit" ? "text-wealth-success" : "text-wealth-danger"
                    }`}
                  >
                    {amountsVisible ? (
                      <>
                        {txn.type === "credit" ? "+" : "-"}₹
                        {Math.abs(txn.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      <span className="tracking-wider text-gray-400">{AMOUNT_MASK}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={txn.type === "credit" ? "success" : "danger"} size="sm">
                      {txn.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditError(null);
                        setEditingTxn(txn);
                      }}
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(txn.id)}
                      className="text-wealth-danger hover:text-red-800 text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-wealth-muted">
          Showing {transactions.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0} to{" "}
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
          {pagination.total} entries
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(setPage(pagination.page - 1))}
            disabled={pagination.page <= 1 || loading}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => dispatch(setPage(pagination.page + 1))}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Transaction</h3>
            {editError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-wealth-danger">
                {editError}
              </div>
            )}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editingTxn.date}
                  onChange={(e) => setEditingTxn({ ...editingTxn, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant / Description
                </label>
                <input
                  type="text"
                  required
                  value={editingTxn.merchant || editingTxn.description}
                  onChange={(e) =>
                    setEditingTxn({
                      ...editingTxn,
                      merchant: e.target.value,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingTxn.amount}
                    onChange={(e) =>
                      setEditingTxn({ ...editingTxn, amount: parseFloat(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    required
                    value={editingTxn.type}
                    onChange={(e) =>
                      setEditingTxn({ ...editingTxn, type: e.target.value as "credit" | "debit" })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingTxn.category || ""}
                  onChange={(e) => setEditingTxn({ ...editingTxn, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Groceries"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditError(null);
                    setEditingTxn(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
