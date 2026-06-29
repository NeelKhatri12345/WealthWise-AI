import React from 'react';
import { type DailySpendingData } from './chartOptions';
interface DailySpendingChartProps {
    data: DailySpendingData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const DailySpendingChart: React.FC<DailySpendingChartProps>;
export default DailySpendingChart;
