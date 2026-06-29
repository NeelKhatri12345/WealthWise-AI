import axiosInstance from './axiosInstance';
export const adminApi = {
    async getAdminStats() {
        const { data } = await axiosInstance.get('/admin/stats');
        return data.data;
    },
    async getUsers() {
        const { data } = await axiosInstance.get('/admin/users');
        return data.data;
    },
    async getUserById(id) {
        const { data } = await axiosInstance.get(`/admin/users/${id}`);
        return data.data;
    },
    async updateUser(id, payload) {
        const { data } = await axiosInstance.patch(`/admin/users/${id}`, payload);
        return data.data;
    },
    async getAuditLogs() {
        const { data } = await axiosInstance.get('/admin/audit-logs');
        return data.data;
    },
    async getSystemHealth() {
        const { data } = await axiosInstance.get('/admin/system-health');
        return data.data;
    },
};
