import axiosInstance from './axiosInstance';
export const uploadApi = {
    async uploadStatement(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axiosInstance.post('/upload/statement', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
                if (event.total && onProgress) {
                    const pct = Math.round((event.loaded * 100) / event.total);
                    onProgress(pct);
                }
            },
        });
        return data.data;
    },
    async getUploadHistory() {
        const { data } = await axiosInstance.get('/upload/history');
        return data.data;
    },
    async getUploadStatus(id) {
        const { data } = await axiosInstance.get(`/upload/${id}/status`);
        return data.data;
    },
    async deleteUpload(id) {
        await axiosInstance.delete(`/upload/${id}`);
    },
};
