import Highcharts from 'highcharts';
export interface AllocationItem {
    name: string;
    value: number;
    color?: string;
}
export declare function getAllocationPieOptions(data: AllocationItem[]): Highcharts.Options;
export interface PerformanceLineData {
    categories: string[];
    portfolio: number[];
    benchmark?: number[];
}
export declare function getPerformanceLineOptions(data: PerformanceLineData): Highcharts.Options;
export interface AssetClassItem {
    name: string;
    value: number;
    color?: string;
}
export declare function getAssetClassOptions(data: AssetClassItem[]): Highcharts.Options;
export interface RebalanceData {
    categories: string[];
    current: number[];
    target: number[];
}
export declare function getRebalanceOptions(data: RebalanceData): Highcharts.Options;
