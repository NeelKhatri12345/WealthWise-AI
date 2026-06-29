import React from 'react';
import { type IncomeVsExpenseData } from './chartOptions';
interface IncomeVsExpenseChartProps {
    data: IncomeVsExpenseData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps>;
export default IncomeVsExpenseChart;
