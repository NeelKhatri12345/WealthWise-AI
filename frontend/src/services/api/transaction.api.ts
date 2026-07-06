import axiosInstance, {
  type ApiResponse,
  type PaginatedResponse,
} from "./axiosInstance";

export interface TransactionResponse {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "credit" | "debit";
  merchant?: string;
  tags?: string[];
  confidenceScore?: number;
}

interface RawTransaction {
  id: string;
  date: string;
  description: string;
  amount: string | number;
  category: string | null;
  transaction_type: "credit" | "debit";
  merchant?: string | null;
  tags?: string[];
  confidence_score?: string | number | null;
}

function mapTransaction(raw: RawTransaction): TransactionResponse {
  return {
    id: raw.id,
    date: raw.date,
    description: raw.description,
    amount: typeof raw.amount === "string" ? parseFloat(raw.amount) : raw.amount,
    category: raw.category || "Uncategorized",
    type: raw.transaction_type,
    merchant: raw.merchant || undefined,
    tags: raw.tags || [],
    confidenceScore: raw.confidence_score != null 
      ? (typeof raw.confidence_score === "string" ? parseFloat(raw.confidence_score) : raw.confidence_score) 
      : undefined,
  };
}

export interface TransactionQueryParams {
  search?: string;
  category?: string;
  type?: "all" | "credit" | "debit";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number | null;
  amountMax?: number | null;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const transactionApi = {
  async getTransactions(
    params: TransactionQueryParams,
  ): Promise<PaginatedResponse<TransactionResponse>> {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== "" && v !== null && v !== undefined && v !== "all",
      ),
    );
    const { data } = await axiosInstance.get<
      PaginatedResponse<RawTransaction>
    >("/transactions", { params: cleanParams });
    return {
      ...data,
      data: data.data.map(mapTransaction),
    };
  },

  async getTransactionById(id: string): Promise<TransactionResponse> {
    const { data } = await axiosInstance.get<ApiResponse<RawTransaction>>(
      `/transactions/${id}`,
    );
    return mapTransaction(data.data);
  },

  async getCategories(): Promise<CategoryResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<CategoryResponse[]>>(
      "/transactions/categories",
    );
    return data.data;
  },

  async searchTransactions(query: string): Promise<TransactionResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<RawTransaction[]>
    >("/transactions/search", { params: { q: query } });
    return data.data.map(mapTransaction);
  },

  async getTransactionsByStatement(
    statementId: string,
  ): Promise<TransactionResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<RawTransaction[]>
    >(`/transactions/statement/${statementId}`);
    return data.data.map(mapTransaction);
  },

  async syncTransactions(
    statementId: string,
    transactions: Partial<TransactionResponse>[],
  ): Promise<void> {
    const rawTransactions = transactions.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      transaction_type: t.type,
      category: t.category,
      merchant: t.merchant,
      confidence_score: t.confidenceScore,
    }));
    await axiosInstance.put(`/transactions/statement/${statementId}/sync`, {
      transactions: rawTransactions,
    });
  },
};
