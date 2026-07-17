import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getDailySpendingOptions,
  type DailySpendingData,
} from "./chartOptions";

interface DailySpendingChartProps {
  data: DailySpendingData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getDailySpendingOptions(data);

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

export default DailySpendingChart;
