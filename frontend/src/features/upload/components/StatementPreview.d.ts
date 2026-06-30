interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
}
interface StatementPreviewProps {
  bankName?: string;
  accountNumber?: string;
  period?: string;
  transactions: ParsedTransaction[];
  onConfirm?: () => void;
  onReject?: () => void;
}
export declare const StatementPreview: ({
  bankName,
  accountNumber,
  period,
  transactions,
  onConfirm,
  onReject,
}: StatementPreviewProps) => import("react").JSX.Element;
export {};
