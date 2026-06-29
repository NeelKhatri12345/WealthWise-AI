interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'credit' | 'debit';
}
interface TransactionListProps {
    transactions: Transaction[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onTransactionClick?: (id: string) => void;
}
export declare const TransactionList: ({ transactions, currentPage, totalPages, onPageChange, onTransactionClick, }: TransactionListProps) => import("react").JSX.Element;
export {};
