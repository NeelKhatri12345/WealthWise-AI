import axiosInstance from './axiosInstance';
export const notificationApi = {
    async getNotifications() {
        const { data } = await axiosInstance.get('/notifications');
        return data.data;
    },
    async markRead(id) {
        await axiosInstance.patch(`/notifications/${id}/read`);
    },
    async markAllRead() {
        await axiosInstance.patch('/notifications/read-all');
    },
    async getPreferences() {
        const { data } = await axiosInstance.get('/notifications/preferences');
        return data.data;
    },
    async updatePreferences(prefs) {
        const { data } = await axiosInstance.patch('/notifications/preferences', prefs);
        return data.data;
    },
};
