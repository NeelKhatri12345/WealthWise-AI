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
export declare const TransactionDetail: ({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailProps) => import("react").JSX.Element | null;
export {};
