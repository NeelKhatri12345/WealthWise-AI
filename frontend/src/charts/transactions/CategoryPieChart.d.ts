import React from "react";
import { type CategoryPieItem } from "./chartOptions";
interface CategoryPieChartProps {
  data: CategoryPieItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const CategoryPieChart: React.FC<CategoryPieChartProps>;
export default CategoryPieChart;
