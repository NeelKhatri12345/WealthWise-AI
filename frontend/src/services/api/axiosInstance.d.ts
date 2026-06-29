declare const axiosInstance: import("axios").AxiosInstance;
export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
export default axiosInstance;
