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
      PaginatedResponse<TransactionResponse>
    >("/transactions", { params: cleanParams });
    return data;
  },

  async getTransactionById(id: string): Promise<TransactionResponse> {
    const { data } = await axiosInstance.get<ApiResponse<TransactionResponse>>(
      `/transactions/${id}`,
    );
    return data.data;
  },

  async getCategories(): Promise<CategoryResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<CategoryResponse[]>>(
      "/transactions/categories",
    );
    return data.data;
  },

  async searchTransactions(query: string): Promise<TransactionResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<TransactionResponse[]>
    >("/transactions/search", { params: { q: query } });
    return data.data;
  },
};
