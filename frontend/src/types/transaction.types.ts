export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: Category;
  subCategory?: string;
  account?: string;
  notes?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface TransactionFilter {
  search?: string;
  type?: "income" | "expense" | "all";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "date" | "amount" | "category";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}
