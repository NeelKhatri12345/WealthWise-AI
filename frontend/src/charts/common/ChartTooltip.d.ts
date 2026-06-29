import React from 'react';
export interface TooltipRow {
    label: string;
    value: string | number;
    color?: string;
}
export interface ChartTooltipProps {
    title?: string;
    rows: TooltipRow[];
    footer?: string;
    className?: string;
}
declare const ChartTooltip: React.FC<ChartTooltipProps>;
export default ChartTooltip;
