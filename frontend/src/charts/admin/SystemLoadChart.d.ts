import React from "react";
import { type SystemLoadData } from "./chartOptions";
interface SystemLoadChartProps {
  data: SystemLoadData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const SystemLoadChart: React.FC<SystemLoadChartProps>;
export default SystemLoadChart;
