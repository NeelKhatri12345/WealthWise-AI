import axiosInstance from './axiosInstance';
export const healthApi = {
    async getHealthScore() {
        const { data } = await axiosInstance.get('/health/score');
        return data.data;
    },
    async getHealthHistory(period = '6m') {
        const { data } = await axiosInstance.get('/health/history', { params: { period } });
        return data.data;
    },
    async getHealthMetrics() {
        const { data } = await axiosInstance.get('/health/metrics');
        return data.data;
    },
};
