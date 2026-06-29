import axiosInstance from './axiosInstance';
export const reportApi = {
    async generateReport(params) {
        const { data } = await axiosInstance.post('/reports/generate', params);
        return data.data;
    },
    async getReports() {
        const { data } = await axiosInstance.get('/reports');
        return data.data;
    },
    async downloadReport(id) {
        const { data } = await axiosInstance.get(`/reports/${id}/download`, {
            responseType: 'blob',
        });
        return data;
    },
};
