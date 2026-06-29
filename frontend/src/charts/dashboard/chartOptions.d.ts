import Highcharts from 'highcharts';
export interface SpendingOverviewData {
    categories: string[];
    data: number[];
}
export declare function getSpendingOverviewOptions(data: SpendingOverviewData): Highcharts.Options;
export interface IncomeVsExpenseData {
    categories: string[];
    income: number[];
    expense: number[];
}
export declare function getIncomeVsExpenseOptions(data: IncomeVsExpenseData): Highcharts.Options;
export interface CategoryDistributionItem {
    name: string;
    value: number;
    color?: string;
}
export declare function getCategoryDistributionOptions(data: CategoryDistributionItem[]): Highcharts.Options;
export interface SavingsRateData {
    categories: string[];
    rates: number[];
}
export declare function getSavingsRateOptions(data: SavingsRateData): Highcharts.Options;
