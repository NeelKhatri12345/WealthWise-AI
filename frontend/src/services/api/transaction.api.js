import axiosInstance from './axiosInstance';
export const transactionApi = {
    async getTransactions(params) {
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== 'all'));
        const { data } = await axiosInstance.get('/transactions', { params: cleanParams });
        return data;
    },
    async getTransactionById(id) {
        const { data } = await axiosInstance.get(`/transactions/${id}`);
        return data.data;
    },
    async getCategories() {
        const { data } = await axiosInstance.get('/transactions/categories');
        return data.data;
    },
    async searchTransactions(query) {
        const { data } = await axiosInstance.get('/transactions/search', { params: { q: query } });
        return data.data;
    },
};
