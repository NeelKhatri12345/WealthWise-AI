import React from "react";
import { type MonthlyTrendData } from "./chartOptions";
interface MonthlyTrendChartProps {
  data: MonthlyTrendData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const MonthlyTrendChart: React.FC<MonthlyTrendChartProps>;
export default MonthlyTrendChart;
