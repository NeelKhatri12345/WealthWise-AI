interface TransactionDetailProps {
  transaction: {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: "credit" | "debit";
    reference?: string;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetail = ({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p
              className={`text-3xl font-bold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
            >
              {transaction.type === "credit" ? "+" : "-"}$
              {Math.abs(transaction.amount).toLocaleString()}
            </p>
          </div>

          <div className="divide-y divide-gray-100 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm font-medium text-gray-900">
                {transaction.date}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Description</span>
              <span className="text-sm font-medium text-gray-900">
                {transaction.description}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Category</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {transaction.category}
              </span>
            </div>
            {transaction.reference && (
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Reference</span>
                <span className="text-sm font-medium text-gray-900">
                  {transaction.reference}
                </span>
              </div>
            )}
            {transaction.notes && (
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Notes</span>
                <span className="text-sm text-gray-900">
                  {transaction.notes}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
