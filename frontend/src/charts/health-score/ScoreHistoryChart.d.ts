import React from 'react';
import { type ScoreHistoryData } from './chartOptions';
interface ScoreHistoryChartProps {
    data: ScoreHistoryData;
    height?: number;
    loading?: boolean;
    error?: string | null;
    className?: string;
}
declare const ScoreHistoryChart: React.FC<ScoreHistoryChartProps>;
export default ScoreHistoryChart;
