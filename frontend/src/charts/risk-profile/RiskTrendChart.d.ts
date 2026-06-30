import React from "react";
import { type RiskTrendData } from "./chartOptions";
interface RiskTrendChartProps {
  data: RiskTrendData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const RiskTrendChart: React.FC<RiskTrendChartProps>;
export default RiskTrendChart;
