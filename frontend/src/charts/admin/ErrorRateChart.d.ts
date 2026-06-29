import React from 'react';
import { type ErrorRateData } from './chartOptions';
interface ErrorRateChartProps {
    data: ErrorRateData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const ErrorRateChart: React.FC<ErrorRateChartProps>;
export default ErrorRateChart;
