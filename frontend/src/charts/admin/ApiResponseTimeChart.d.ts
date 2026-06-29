import React from 'react';
import { type ApiResponseTimeData } from './chartOptions';
interface ApiResponseTimeChartProps {
    data: ApiResponseTimeData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const ApiResponseTimeChart: React.FC<ApiResponseTimeChartProps>;
export default ApiResponseTimeChart;
