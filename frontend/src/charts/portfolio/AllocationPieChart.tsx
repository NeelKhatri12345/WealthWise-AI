import React from "react";
import BaseChart from "../common/BaseChart";
import { getAllocationPieOptions, type AllocationItem } from "./chartOptions";

interface AllocationPieChartProps {
  data: AllocationItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const AllocationPieChart: React.FC<AllocationPieChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getAllocationPieOptions(data);

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

export default AllocationPieChart;
