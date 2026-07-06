import { useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchTransactions } from "@/store/slices/transactionSlice";
import { TransactionsFilterBar } from "./components/TransactionsFilterBar";
import { TransactionsTable } from "./components/TransactionsTable";
import { TransactionsBulkActions } from "./components/TransactionsBulkActions";

export default function TransactionsPage() {
  useDocumentTitle("Transactions");
  const dispatch = useAppDispatch();
  const { filters, pagination: { page }, error } = useAppSelector((state) => state.transactions);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch, filters, page]);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <PageHeader
        title="Transactions"
        description="View and manage your categorized transactions across all statements"
      />
      
      {error && (
        <div className="bg-red-50 text-wealth-danger p-4 rounded-md mb-4 border border-red-200">
          {error}
        </div>
      )}

      <TransactionsFilterBar />
      <TransactionsBulkActions />
      
      <div className="flex-1 min-h-0 bg-white p-4 rounded-lg border border-wealth-border shadow-sm flex flex-col">
        <TransactionsTable />
      </div>
    </div>
  );
}
