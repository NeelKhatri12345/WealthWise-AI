import React from "react";
import { type CategoryDistributionItem } from "./chartOptions";
interface CategoryDistributionChartProps {
  data: CategoryDistributionItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const CategoryDistributionChart: React.FC<CategoryDistributionChartProps>;
export default CategoryDistributionChart;
