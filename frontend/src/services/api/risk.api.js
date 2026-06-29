import axiosInstance from './axiosInstance';
export const riskApi = {
    async getRiskProfile() {
        const { data } = await axiosInstance.get('/risk/profile');
        return data.data;
    },
    async submitAssessment(answers) {
        const { data } = await axiosInstance.post('/risk/assessment', { answers });
        return data.data;
    },
    async getRiskHistory() {
        const { data } = await axiosInstance.get('/risk/history');
        return data.data;
    },
    async getRiskFactors() {
        const { data } = await axiosInstance.get('/risk/factors');
        return data.data;
    },
};
