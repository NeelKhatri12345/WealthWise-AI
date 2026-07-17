import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getPerformanceLineOptions,
  type PerformanceLineData,
} from "./chartOptions";

interface PerformanceLineChartProps {
  data: PerformanceLineData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getPerformanceLineOptions(data);

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

export default PerformanceLineChart;
