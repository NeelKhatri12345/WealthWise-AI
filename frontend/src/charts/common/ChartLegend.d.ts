import React from "react";
export interface LegendItem {
  name: string;
  color: string;
  value?: string | number;
  active?: boolean;
}
export interface ChartLegendProps {
  items: LegendItem[];
  onToggle?: (index: number) => void;
  layout?: "horizontal" | "vertical";
  className?: string;
}
declare const ChartLegend: React.FC<ChartLegendProps>;
export default ChartLegend;
