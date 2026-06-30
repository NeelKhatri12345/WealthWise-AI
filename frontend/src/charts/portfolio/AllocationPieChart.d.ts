import React from "react";
import { type AllocationItem } from "./chartOptions";
interface AllocationPieChartProps {
  data: AllocationItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const AllocationPieChart: React.FC<AllocationPieChartProps>;
export default AllocationPieChart;
