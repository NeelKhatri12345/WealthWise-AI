import { isRejectedWithValue } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
export const apiMiddleware = () => (next) => (action) => {
    if (isRejectedWithValue(action)) {
        const payload = action.payload;
        const status = payload?.status;
        const message = payload?.data?.message ?? 'An unexpected error occurred';
        if (status === 401) {
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
            return next(action);
        }
        if (status === 403) {
            toast.error('You do not have permission to perform this action.');
            return next(action);
        }
        if (status === 429) {
            toast.error('Too many requests. Please try again later.');
            return next(action);
        }
        if (status && status >= 500) {
            toast.error('Server error. Please try again later.');
            return next(action);
        }
        if (message && status !== 422) {
            toast.error(message);
        }
    }
    return next(action);
};
