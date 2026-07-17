interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "credit" | "debit";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export const RecentTransactions = ({
  transactions,
  onViewAll,
}: RecentTransactionsProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </button>
        )}
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent transactions
          </p>
        ) : (
          transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                  {txn.category.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {txn.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {txn.category} &middot; {txn.date}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  txn.type === "credit" ? "text-green-600" : "text-red-600"
                }`}
              >
                {txn.type === "credit" ? "+" : "-"}$
                {Math.abs(txn.amount).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
