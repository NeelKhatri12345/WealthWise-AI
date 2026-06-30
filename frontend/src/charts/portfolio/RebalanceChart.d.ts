import React from "react";
import { type RebalanceData } from "./chartOptions";
interface RebalanceChartProps {
  data: RebalanceData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const RebalanceChart: React.FC<RebalanceChartProps>;
export default RebalanceChart;
