export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly LOGOUT: "/auth/logout";
        readonly REFRESH: "/auth/refresh";
        readonly ME: "/auth/me";
    };
    readonly USERS: {
        readonly PROFILE: "/users/profile";
        readonly UPDATE: "/users/profile";
        readonly CHANGE_PASSWORD: "/users/change-password";
    };
    readonly TRANSACTIONS: {
        readonly LIST: "/transactions";
        readonly DETAIL: (id: string) => string;
        readonly UPLOAD: "/transactions/upload";
        readonly CATEGORIES: "/transactions/categories";
    };
    readonly HEALTH: {
        readonly SCORE: "/health/score";
        readonly HISTORY: "/health/history";
        readonly METRICS: "/health/metrics";
    };
    readonly RISK: {
        readonly PROFILE: "/risk/profile";
        readonly ASSESSMENT: "/risk/assessment";
    };
    readonly PORTFOLIO: {
        readonly RECOMMENDATIONS: "/portfolio/recommendations";
        readonly ALLOCATIONS: "/portfolio/allocations";
    };
    readonly COACH: {
        readonly CHAT: "/coach/chat";
        readonly SESSIONS: "/coach/sessions";
        readonly ADVICE: "/coach/advice";
    };
    readonly REPORTS: {
        readonly LIST: "/reports";
        readonly GENERATE: "/reports/generate";
        readonly DOWNLOAD: (id: string) => string;
    };
    readonly NOTIFICATIONS: {
        readonly LIST: "/notifications";
        readonly MARK_READ: (id: string) => string;
        readonly PREFERENCES: "/notifications/preferences";
    };
    readonly ADMIN: {
        readonly DASHBOARD: "/admin/dashboard";
        readonly USERS: "/admin/users";
        readonly AUDIT_LOG: "/admin/audit-log";
        readonly SYSTEM_HEALTH: "/admin/system-health";
    };
};
