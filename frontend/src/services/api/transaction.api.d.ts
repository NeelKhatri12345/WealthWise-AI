import { type PaginatedResponse } from './axiosInstance';
export interface TransactionResponse {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'credit' | 'debit';
    merchant?: string;
    tags?: string[];
}
export interface TransactionQueryParams {
    search?: string;
    category?: string;
    type?: 'all' | 'credit' | 'debit';
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
export declare const transactionApi: {
    getTransactions(params: TransactionQueryParams): Promise<PaginatedResponse<TransactionResponse>>;
    getTransactionById(id: string): Promise<TransactionResponse>;
    getCategories(): Promise<CategoryResponse[]>;
    searchTransactions(query: string): Promise<TransactionResponse[]>;
};
