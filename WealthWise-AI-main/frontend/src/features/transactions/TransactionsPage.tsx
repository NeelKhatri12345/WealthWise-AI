import { useState } from "react";
import {
  TransactionList,
  TransactionFilters,
  TransactionDetail,
  CategoryBreakdown,
  MonthlyTrend,
  TransactionSearch,
} from "./components";
import { useTransactions, useTransactionFilters } from "./hooks";

export const TransactionsPage = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const { filters, setFilters, resetFilters } = useTransactionFilters();
  const { transactions, totalPages, isLoading } = useTransactions({
    page,
    search: searchQuery,
  });

  const selectedTransaction = transactions.find((t) => t.id === selectedTxnId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your financial transactions
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <TransactionSearch onSearch={setSearchQuery} />
        </div>
      </div>

      <TransactionFilters
        filters={filters}
        categories={["Food", "Transport", "Shopping", "Bills", "Entertainment"]}
        onFilterChange={setFilters}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryBreakdown data={[]} />
        <MonthlyTrend data={[]} />
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <TransactionList
          transactions={transactions}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onTransactionClick={setSelectedTxnId}
        />
      )}

      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          isOpen={!!selectedTxnId}
          onClose={() => setSelectedTxnId(null)}
        />
      )}
    </div>
  );
};
