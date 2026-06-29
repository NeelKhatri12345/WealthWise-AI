import React from 'react';
import { type BenchmarkComparisonData } from './chartOptions';
interface BenchmarkComparisonChartProps {
    data: BenchmarkComparisonData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const BenchmarkComparisonChart: React.FC<BenchmarkComparisonChartProps>;
export default BenchmarkComparisonChart;
