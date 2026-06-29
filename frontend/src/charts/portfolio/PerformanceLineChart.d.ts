import React from 'react';
import { type PerformanceLineData } from './chartOptions';
interface PerformanceLineChartProps {
    data: PerformanceLineData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const PerformanceLineChart: React.FC<PerformanceLineChartProps>;
export default PerformanceLineChart;
