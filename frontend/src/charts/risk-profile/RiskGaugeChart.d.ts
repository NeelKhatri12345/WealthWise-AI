import React from "react";
import { type RiskGaugeData } from "./chartOptions";
interface RiskGaugeChartProps {
  data: RiskGaugeData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const RiskGaugeChart: React.FC<RiskGaugeChartProps>;
export default RiskGaugeChart;
