import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getCategoryDistributionOptions,
  type CategoryDistributionItem,
} from "./chartOptions";

interface CategoryDistributionChartProps {
  data: CategoryDistributionItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getCategoryDistributionOptions(data);

  return (
    <BaseChart
      options={options}
      height={height}
      loading={loading}
      error={error}
      className={className}
    />
  );
};

export default CategoryDistributionChart;
