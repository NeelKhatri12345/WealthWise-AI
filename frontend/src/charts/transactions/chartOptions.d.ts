import Highcharts from 'highcharts';
export interface MonthlyTrendData {
    categories: string[];
    amounts: number[];
    counts: number[];
}
export declare function getMonthlyTrendOptions(data: MonthlyTrendData): Highcharts.Options;
export interface CategoryPieItem {
    name: string;
    value: number;
    color?: string;
}
export declare function getCategoryPieOptions(data: CategoryPieItem[]): Highcharts.Options;
export interface DailySpendingData {
    categories: string[];
    amounts: number[];
}
export declare function getDailySpendingOptions(data: DailySpendingData): Highcharts.Options;
