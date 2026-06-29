import axiosInstance from './axiosInstance';
export const dashboardApi = {
    async getDashboardStats() {
        const { data } = await axiosInstance.get('/dashboard/stats');
        return data.data;
    },
    async getRecentTransactions() {
        const { data } = await axiosInstance.get('/dashboard/recent-transactions');
        return data.data;
    },
    async getWidgets() {
        const { data } = await axiosInstance.get('/dashboard/widgets');
        return data.data;
    },
};
