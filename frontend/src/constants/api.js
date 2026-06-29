export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        ME: "/auth/me",
    },
    USERS: {
        PROFILE: "/users/profile",
        UPDATE: "/users/profile",
        CHANGE_PASSWORD: "/users/change-password",
    },
    TRANSACTIONS: {
        LIST: "/transactions",
        DETAIL: (id) => `/transactions/${id}`,
        UPLOAD: "/transactions/upload",
        CATEGORIES: "/transactions/categories",
    },
    HEALTH: {
        SCORE: "/health/score",
        HISTORY: "/health/history",
        METRICS: "/health/metrics",
    },
    RISK: {
        PROFILE: "/risk/profile",
        ASSESSMENT: "/risk/assessment",
    },
    PORTFOLIO: {
        RECOMMENDATIONS: "/portfolio/recommendations",
        ALLOCATIONS: "/portfolio/allocations",
    },
    COACH: {
        CHAT: "/coach/chat",
        SESSIONS: "/coach/sessions",
        ADVICE: "/coach/advice",
    },
    REPORTS: {
        LIST: "/reports",
        GENERATE: "/reports/generate",
        DOWNLOAD: (id) => `/reports/${id}/download`,
    },
    NOTIFICATIONS: {
        LIST: "/notifications",
        MARK_READ: (id) => `/notifications/${id}/read`,
        PREFERENCES: "/notifications/preferences",
    },
    ADMIN: {
        DASHBOARD: "/admin/dashboard",
        USERS: "/admin/users",
        AUDIT_LOG: "/admin/audit-log",
        SYSTEM_HEALTH: "/admin/system-health",
    },
};
