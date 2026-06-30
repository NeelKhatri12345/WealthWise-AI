import React from "react";
import { type ScoreGaugeData } from "./chartOptions";
interface ScoreGaugeChartProps {
  data: ScoreGaugeData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const ScoreGaugeChart: React.FC<ScoreGaugeChartProps>;
export default ScoreGaugeChart;
