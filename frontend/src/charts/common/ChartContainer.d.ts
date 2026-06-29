import React from 'react';
export type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';
export interface ChartContainerProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    showTimeRange?: boolean;
    timeRanges?: TimeRange[];
    defaultRange?: TimeRange;
    onTimeRangeChange?: (range: TimeRange) => void;
    actions?: React.ReactNode;
    className?: string;
}
declare const ChartContainer: React.FC<ChartContainerProps>;
export default ChartContainer;
