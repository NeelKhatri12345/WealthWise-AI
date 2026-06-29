import React from 'react';
import Highcharts from 'highcharts';
export interface BaseChartProps {
    options: Highcharts.Options;
    type?: string;
    height?: number | string;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const BaseChart: React.FC<BaseChartProps>;
export default BaseChart;
