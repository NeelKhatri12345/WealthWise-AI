interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "credit" | "debit";
  reference?: string;
  notes?: string;
}
interface UseTransactionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
interface UseTransactionsReturn {
  transactions: Transaction[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
export declare const useTransactions: ({
  page,
  pageSize,
  search,
}?: UseTransactionsParams) => UseTransactionsReturn;
export {};
