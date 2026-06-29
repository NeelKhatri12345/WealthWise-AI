type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';
interface RiskProfileData {
    level: RiskLevel;
    score: number;
    factors: Array<{
        name: string;
        value: number;
        maxValue: number;
        description: string;
        status: 'good' | 'warning' | 'danger';
    }>;
    history: Array<{
        date: string;
        score: number;
        level: string;
    }>;
    benchmarks: Array<{
        label: string;
        userValue: number;
        benchmarkValue: number;
        unit?: string;
    }>;
}
interface UseRiskProfileReturn {
    data: RiskProfileData | null;
    isLoading: boolean;
    error: string | null;
    submitAssessment: (answers: Record<string, string>) => Promise<void>;
    refetch: () => void;
}
export declare const useRiskProfile: () => UseRiskProfileReturn;
export {};
