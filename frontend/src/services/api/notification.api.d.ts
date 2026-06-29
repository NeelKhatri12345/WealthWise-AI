export interface NotificationResponse {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    actionUrl?: string;
}
export interface NotificationPreferencesResponse {
    email: boolean;
    push: boolean;
    budgetAlerts: boolean;
    transactionAlerts: boolean;
    weeklyReport: boolean;
    healthScoreAlerts: boolean;
}
export declare const notificationApi: {
    getNotifications(): Promise<NotificationResponse[]>;
    markRead(id: string): Promise<void>;
    markAllRead(): Promise<void>;
    getPreferences(): Promise<NotificationPreferencesResponse>;
    updatePreferences(prefs: Partial<NotificationPreferencesResponse>): Promise<NotificationPreferencesResponse>;
};
