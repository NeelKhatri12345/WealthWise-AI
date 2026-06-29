import axiosInstance from './axiosInstance';
export const authApi = {
    async login(credentials) {
        const { data } = await axiosInstance.post('/auth/login', credentials);
        return data.data;
    },
    async register(payload) {
        const { data } = await axiosInstance.post('/auth/register', payload);
        return data.data;
    },
    async logout() {
        await axiosInstance.post('/auth/logout');
    },
    async refreshToken(refreshToken) {
        const { data } = await axiosInstance.post('/auth/refresh', { refreshToken });
        return data.data;
    },
    async forgotPassword(email) {
        const { data } = await axiosInstance.post('/auth/forgot-password', { email });
        return data.data;
    },
    async resetPassword(token, password) {
        const { data } = await axiosInstance.post('/auth/reset-password', { token, password });
        return data.data;
    },
    async updateProfile(payload) {
        const { data } = await axiosInstance.patch('/auth/profile', payload);
        return data.data;
    },
};
