import React from "react";
import { type RiskFactorData } from "./chartOptions";
interface RiskFactorChartProps {
  data: RiskFactorData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const RiskFactorChart: React.FC<RiskFactorChartProps>;
export default RiskFactorChart;
