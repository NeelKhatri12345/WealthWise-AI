import React from 'react';
import { type FactorBarData } from './chartOptions';
interface FactorBarChartProps {
    data: FactorBarData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const FactorBarChart: React.FC<FactorBarChartProps>;
export default FactorBarChart;
