import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    notifications: [],
    unreadCount: 0,
    preferences: null,
    loading: false,
    error: null,
};
export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const { notificationApi } = await import('../../services/api/notification.api');
        return await notificationApi.getNotifications();
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to fetch notifications');
    }
});
export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id, { rejectWithValue }) => {
    try {
        const { notificationApi } = await import('../../services/api/notification.api');
        await notificationApi.markRead(id);
        return id;
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to mark as read');
    }
});
export const updatePreferences = createAsyncThunk('notifications/updatePreferences', async (prefs, { rejectWithValue }) => {
    try {
        const { notificationApi } = await import('../../services/api/notification.api');
        return await notificationApi.updatePreferences(prefs);
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Failed to update preferences');
    }
});
const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification(state, action) {
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
            state.loading = false;
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter((n) => !n.read).length;
        })
            .addCase(fetchNotifications.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(markAsRead.fulfilled, (state, action) => {
            const notification = state.notifications.find((n) => n.id === action.payload);
            if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        })
            .addCase(updatePreferences.fulfilled, (state, action) => {
            state.preferences = action.payload;
        });
    },
});
export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
