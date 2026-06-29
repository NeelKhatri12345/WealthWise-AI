import axiosInstance from './axiosInstance';
export const portfolioApi = {
    async getRecommendations() {
        const { data } = await axiosInstance.get('/portfolio/recommendations');
        return data.data;
    },
    async getAllocations() {
        const { data } = await axiosInstance.get('/portfolio/allocations');
        return data.data;
    },
    async getPortfolioSummary() {
        const { data } = await axiosInstance.get('/portfolio/summary');
        return data.data;
    },
};
