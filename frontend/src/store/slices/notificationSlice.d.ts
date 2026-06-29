export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    actionUrl?: string;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    budgetAlerts: boolean;
    transactionAlerts: boolean;
    weeklyReport: boolean;
    healthScoreAlerts: boolean;
}
export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreferences | null;
    loading: boolean;
    error: string | null;
}
export declare const fetchNotifications: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/notification.api").NotificationResponse[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const markAsRead: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const updatePreferences: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/notification.api").NotificationPreferencesResponse, Partial<NotificationPreferences>, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "notifications/addNotification">;
declare const _default: import("redux").Reducer<NotificationState>;
export default _default;
