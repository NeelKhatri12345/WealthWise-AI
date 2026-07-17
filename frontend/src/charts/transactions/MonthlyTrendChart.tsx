import React from "react";
import BaseChart from "../common/BaseChart";
import { getMonthlyTrendOptions, type MonthlyTrendData } from "./chartOptions";

interface MonthlyTrendChartProps {
  data: MonthlyTrendData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getMonthlyTrendOptions(data);

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

export default MonthlyTrendChart;
