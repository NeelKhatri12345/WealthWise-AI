export interface HealthMetric {
    name: string;
    value: number;
    maxValue: number;
    status: 'good' | 'fair' | 'poor';
    description: string;
}
export interface HealthTip {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
}
export interface HealthScoreState {
    currentScore: number | null;
    history: {
        date: string;
        score: number;
    }[];
    metrics: HealthMetric[];
    tips: HealthTip[];
    loading: boolean;
    error: string | null;
}
export declare const fetchHealthScore: import("@reduxjs/toolkit").AsyncThunk<{
    metrics: import("../../services/api/health.api").HealthMetricResponse[];
    score: number;
    tips: {
        id: string;
        title: string;
        description: string;
        category: string;
        priority: "high" | "medium" | "low";
    }[];
}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchHealthHistory: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/health.api").HealthHistoryItem[], string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearHealthError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"healthScore/clearHealthError">;
declare const _default: import("redux").Reducer<HealthScoreState>;
export default _default;
