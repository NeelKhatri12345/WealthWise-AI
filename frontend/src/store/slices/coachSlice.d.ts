export interface CoachMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface CoachSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}
export interface CoachState {
    messages: CoachMessage[];
    sessions: CoachSession[];
    currentSession: string | null;
    loading: boolean;
    error: string | null;
}
export declare const sendMessage: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/coach.api").CoachMessageResponse, {
    sessionId: string;
    content: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchSessions: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/coach.api").CoachSessionResponse[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createSession: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/coach.api").CoachSessionResponse, string | undefined, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const setCurrentSession: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "coach/setCurrentSession">, addMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<CoachMessage, "coach/addMessage">, clearCoachError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"coach/clearCoachError">;
declare const _default: import("redux").Reducer<CoachState>;
export default _default;
