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

interface RawPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
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
  statementId?: string;
  merchant?: string;
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
    const { data } = await axiosInstance.get<RawPaginatedResponse<RawTransaction>>(
      "/transactions",
      { params: cleanParams }
    );
    return {
      data: data.data.map(mapTransaction),
      pagination: {
        page: data.meta.page,
        pageSize: data.meta.page_size,
        total: data.meta.total,
        totalPages: data.meta.total_pages,
      },
    };
  },

  async getTransactionById(id: string): Promise<TransactionResponse> {
    const { data } = await axiosInstance.get<ApiResponse<RawTransaction>>(
      `/transactions/${id}`,
    );
    return mapTransaction(data.data);
  },

  async getCategories(): Promise<CategoryResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<string[]>>(
      "/transactions/categories",
    );
    return data.data.map((c: string) => ({
      id: c,
      name: c,
      icon: "tag",
      color: "#6b7280",
    }));
  },

  async searchTransactions(query: string): Promise<TransactionResponse[]> {
    const { data } = await axiosInstance.get<
      RawPaginatedResponse<RawTransaction>
    >("/transactions", { params: { search: query } });
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

  async updateTransaction(
    id: string,
    data: Partial<TransactionResponse>,
  ): Promise<TransactionResponse> {
    const rest: Record<string, unknown> = { ...data };
    delete rest.type;
    delete rest.confidenceScore;
    const payload = {
      ...rest,
      ...(data.type !== undefined ? { transaction_type: data.type } : {}),
    };
    
    const { data: resData } = await axiosInstance.put<ApiResponse<RawTransaction>>(
      `/transactions/${id}`,
      payload,
    );
    return mapTransaction(resData.data);
  },

  async deleteTransaction(id: string): Promise<void> {
    await axiosInstance.delete(`/transactions/${id}`);
  },

  async bulkUpdateCategory(
    transactionIds: string[],
    category: string,
  ): Promise<{ updatedCount: number }> {
    const { data } = await axiosInstance.patch<ApiResponse<{ updated_count: number }>>(
      "/transactions/bulk/category",
      { transaction_ids: transactionIds, category },
    );
    return { updatedCount: data.data.updated_count };
  },

  async bulkDeleteTransactions(
    transactionIds: string[],
  ): Promise<{ deletedCount: number }> {
    const { data } = await axiosInstance.delete<ApiResponse<{ deleted_count: number }>>(
      "/transactions/bulk/delete",
      { data: { transaction_ids: transactionIds } },
    );
    return { deletedCount: data.data.deleted_count };
  },
};
