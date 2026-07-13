import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTransactions, deleteAllTransactionsThunk } from "@/store/slices/transactionSlice";
import { TransactionsFilterBar } from "./components/TransactionsFilterBar";
import { TransactionsTable } from "./components/TransactionsTable";
import { TransactionsBulkActions } from "./components/TransactionsBulkActions";

interface TransactionsPageProps {
  hideHeader?: boolean;
}

export default function TransactionsPage({ hideHeader = false }: TransactionsPageProps) {
  if (!hideHeader) {
    useDocumentTitle("Transactions");
  }
  const dispatch = useAppDispatch();
  const { filters, pagination: { page }, error } = useAppSelector((state) => state.transactions);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch, filters, page]);

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    const resultAction = await dispatch(deleteAllTransactionsThunk());
    setDeletingAll(false);
    setShowDeleteAllDialog(false);
    if (deleteAllTransactionsThunk.fulfilled.match(resultAction)) {
      toast.success("All transactions deleted successfully");
      dispatch(fetchTransactions());
    } else {
      const errorMsg = resultAction.payload as string ?? "Failed to delete all transactions";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {!hideHeader && (
        <PageHeader
          title="Transactions"
          description="View and manage your categorized transactions across all statements"
        />
      )}
      
      {error && (
        <div className="bg-red-50 text-wealth-danger p-4 rounded-md mb-4 border border-red-200">
          {error}
        </div>
      )}

      <TransactionsFilterBar onDeleteAll={() => setShowDeleteAllDialog(true)} />

      <TransactionsBulkActions />
      
      <div className="flex-1 min-h-0 bg-white p-4 rounded-lg border border-wealth-border shadow-sm flex flex-col">
        <TransactionsTable />
      </div>

      {/* Delete All confirmation dialog */}
      {showDeleteAllDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete all transactions?</h3>
            <p className="text-sm text-wealth-muted mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllDialog(false)}
                disabled={deletingAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="px-4 py-2 text-sm font-medium bg-wealth-danger text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              >
                {deletingAll ? "Deleting…" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
