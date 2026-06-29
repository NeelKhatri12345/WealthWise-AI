import axiosInstance from './axiosInstance';
export const coachApi = {
    async sendMessage(sessionId, content) {
        const { data } = await axiosInstance.post(`/coach/sessions/${sessionId}/messages`, { content });
        return data.data;
    },
    async getSessions() {
        const { data } = await axiosInstance.get('/coach/sessions');
        return data.data;
    },
    async getSessionMessages(sessionId) {
        const { data } = await axiosInstance.get(`/coach/sessions/${sessionId}/messages`);
        return data.data;
    },
    async createSession(title) {
        const { data } = await axiosInstance.post('/coach/sessions', { title });
        return data.data;
    },
};
