interface Transaction {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    type: 'credit' | 'debit';
}
interface RecentTransactionsProps {
    transactions: Transaction[];
    onViewAll?: () => void;
}
export declare const RecentTransactions: ({ transactions, onViewAll }: RecentTransactionsProps) => import("react").JSX.Element;
export {};
