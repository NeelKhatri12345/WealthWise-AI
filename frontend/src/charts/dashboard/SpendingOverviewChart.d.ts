import React from 'react';
import { type SpendingOverviewData } from './chartOptions';
interface SpendingOverviewChartProps {
    data: SpendingOverviewData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const SpendingOverviewChart: React.FC<SpendingOverviewChartProps>;
export default SpendingOverviewChart;
