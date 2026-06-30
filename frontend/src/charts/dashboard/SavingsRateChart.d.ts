import React from "react";
import { type SavingsRateData } from "./chartOptions";
interface SavingsRateChartProps {
  data: SavingsRateData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const SavingsRateChart: React.FC<SavingsRateChartProps>;
export default SavingsRateChart;
