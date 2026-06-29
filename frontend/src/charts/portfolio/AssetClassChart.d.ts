import React from 'react';
import { type AssetClassItem } from './chartOptions';
interface AssetClassChartProps {
    data: AssetClassItem[];
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const AssetClassChart: React.FC<AssetClassChartProps>;
export default AssetClassChart;
