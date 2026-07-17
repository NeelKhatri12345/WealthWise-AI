import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  selectReviewTransactions,
  selectReviewIsLoading,
  selectReviewError,
  updateTransaction,
  deleteTransaction,
  addTransaction
} from "@/store/slices/statementReviewSlice";
import { Badge } from "@/components/ui/Badge";
import { TransactionResponse } from "@/services/api/transaction.api";

interface ReviewTransactionTableProps {
  statementId: string;
}

export const ReviewTransactionTable: React.FC<ReviewTransactionTableProps> = () => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectReviewTransactions);
  const isLoading = useAppSelector(selectReviewIsLoading);
  const error = useAppSelector(selectReviewError);

  const [editingTxn, setEditingTxn] = useState<TransactionResponse | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [sortCol, setSortCol] = useState<keyof TransactionResponse>("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting logic
  const sortedTransactions = [...transactions].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (valA === undefined) valA = "";
    if (valB === undefined) valB = "";
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (col: keyof TransactionResponse) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      dispatch(deleteTransaction(id));
    }
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTxn) {
      dispatch(updateTransaction(editingTxn));
      setEditingTxn(null);
    }
  };

  const handleSaveAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingTxn) {
      const newTxn = { ...editingTxn, id: crypto.randomUUID() };
      dispatch(addTransaction(newTxn));
      setIsAdding(false);
      setEditingTxn(null);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-wealth-muted animate-pulse">Loading transactions...</div>;
  }

  if (error) {
    return <div className="py-12 text-center text-wealth-danger">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-wealth-muted">
          Review your parsed transactions. Low confidence rows are highlighted in yellow.
        </p>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingTxn({
              id: "",
              date: new Date().toISOString().split("T")[0],
              description: "",
              amount: 0,
              type: "debit",
              category: "Uncategorized",
              merchant: ""
            } as TransactionResponse);
          }}
          className="px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-wealth-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-wealth-border text-wealth-muted uppercase text-xs">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("date")}>Date {sortCol === "date" && (sortAsc ? "↑" : "↓")}</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("merchant")}>Merchant {sortCol === "merchant" && (sortAsc ? "↑" : "↓")}</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("category")}>Category {sortCol === "category" && (sortAsc ? "↑" : "↓")}</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort("amount")}>Amount {sortCol === "amount" && (sortAsc ? "↑" : "↓")}</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort("type")}>Type {sortCol === "type" && (sortAsc ? "↑" : "↓")}</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wealth-border">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-wealth-muted">
                  No transactions found. You can add one manually.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((txn) => {
                const isLowConfidence = txn.confidenceScore !== undefined && txn.confidenceScore !== null && txn.confidenceScore < 0.8;
                return (
                  <tr key={txn.id} className={`${isLowConfidence ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 text-gray-600">{txn.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{txn.merchant || txn.description}</td>
                    <td className="px-4 py-3 text-gray-600">{txn.category || "—"}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${txn.type === "credit" ? "text-wealth-success" : "text-wealth-danger"}`}>
                      {txn.type === "credit" ? "+" : "-"}₹{Math.abs(txn.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={txn.type === "credit" ? "success" : "danger"} size="sm">{txn.type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {txn.confidenceScore ? (
                        <span className={`text-xs font-medium ${isLowConfidence ? "text-yellow-700" : "text-green-700"}`}>
                          {(txn.confidenceScore * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setEditingTxn(txn)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(txn.id)} className="text-wealth-danger hover:text-red-800 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {(editingTxn || isAdding) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{isAdding ? "Add Transaction" : "Edit Transaction"}</h3>
            <form onSubmit={isAdding ? handleSaveAdd : handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={editingTxn?.date || ""} onChange={(e) => setEditingTxn(prev => prev ? { ...prev, date: e.target.value } : null)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Description</label>
                <input type="text" required value={editingTxn?.merchant || editingTxn?.description || ""} onChange={(e) => setEditingTxn(prev => prev ? { ...prev, merchant: e.target.value, description: e.target.value } : null)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input type="number" step="0.01" min="0" required value={editingTxn?.amount || ""} onChange={(e) => setEditingTxn(prev => prev ? { ...prev, amount: parseFloat(e.target.value) } : null)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select required value={editingTxn?.type || "debit"} onChange={(e) => setEditingTxn(prev => prev ? { ...prev, type: e.target.value as "credit"|"debit" } : null)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input type="text" value={editingTxn?.category || ""} onChange={(e) => setEditingTxn(prev => prev ? { ...prev, category: e.target.value } : null)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g. Groceries" />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setEditingTxn(null); setIsAdding(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors">
                  {isAdding ? "Add" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
