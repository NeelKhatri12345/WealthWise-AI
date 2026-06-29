import Highcharts from 'highcharts';
export interface RiskGaugeData {
    score: number;
    maxScore?: number;
    riskLevel?: string;
}
export declare function getRiskGaugeOptions(data: RiskGaugeData): Highcharts.Options;
export interface RiskFactorData {
    categories: string[];
    values: number[];
}
export declare function getRiskFactorOptions(data: RiskFactorData): Highcharts.Options;
export interface RiskTrendData {
    categories: string[];
    scores: number[];
}
export declare function getRiskTrendOptions(data: RiskTrendData): Highcharts.Options;
export interface BenchmarkComparisonData {
    categories: string[];
    userValues: number[];
    benchmarkValues: number[];
}
export declare function getBenchmarkComparisonOptions(data: BenchmarkComparisonData): Highcharts.Options;
