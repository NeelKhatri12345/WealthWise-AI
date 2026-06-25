interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

interface StatementPreviewProps {
  bankName?: string;
  accountNumber?: string;
  period?: string;
  transactions: ParsedTransaction[];
  onConfirm?: () => void;
  onReject?: () => void;
}

export const StatementPreview = ({
  bankName,
  accountNumber,
  period,
  transactions,
  onConfirm,
  onReject,
}: StatementPreviewProps) => {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Statement Preview</h3>
        <div className="mt-1 flex gap-4 text-sm text-gray-500">
          {bankName && <span>Bank: {bankName}</span>}
          {accountNumber && <span>Account: ****{accountNumber.slice(-4)}</span>}
          {period && <span>Period: {period}</span>}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((txn, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-600">{txn.date}</td>
                <td className="px-6 py-3 text-gray-900">{txn.description}</td>
                <td className={`px-6 py-3 text-right font-medium ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'credit' ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
        {onReject && (
          <button
            onClick={onReject}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reject
          </button>
        )}
        {onConfirm && (
          <button
            onClick={onConfirm}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Confirm & Import
          </button>
        )}
      </div>
    </div>
  );
};
