export interface RiskFactor {
    name: string;
    score: number;
    weight: number;
    description: string;
}
export interface RiskProfile {
    score: number;
    level: 'low' | 'moderate' | 'high' | 'very_high';
    summary: string;
    lastUpdated: string;
}
export interface RiskAssessment {
    questionId: string;
    question: string;
    answer: string;
}
export interface RiskProfileState {
    profile: RiskProfile | null;
    factors: RiskFactor[];
    assessment: RiskAssessment[];
    history: {
        date: string;
        score: number;
    }[];
    loading: boolean;
    error: string | null;
}
export declare const fetchRiskProfile: import("@reduxjs/toolkit").AsyncThunk<{
    profile: import("../../services/api/risk.api").RiskProfileResponse;
    factors: import("../../services/api/risk.api").RiskFactorResponse[];
    history: import("../../services/api/risk.api").RiskHistoryItem[];
}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const submitAssessment: import("@reduxjs/toolkit").AsyncThunk<import("../../services/api/risk.api").RiskProfileResponse, {
    questionId: string;
    answer: string;
}[], import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearRiskError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"riskProfile/clearRiskError">;
declare const _default: import("redux").Reducer<RiskProfileState>;
export default _default;
