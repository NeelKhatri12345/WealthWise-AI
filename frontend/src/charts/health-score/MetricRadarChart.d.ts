import React from "react";
import { type MetricRadarData } from "./chartOptions";
interface MetricRadarChartProps {
  data: MetricRadarData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const MetricRadarChart: React.FC<MetricRadarChartProps>;
export default MetricRadarChart;
