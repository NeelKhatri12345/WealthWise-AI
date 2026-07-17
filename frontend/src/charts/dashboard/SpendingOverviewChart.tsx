import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getSpendingOverviewOptions,
  type SpendingOverviewData,
} from "./chartOptions";

interface SpendingOverviewChartProps {
  data: SpendingOverviewData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const SpendingOverviewChart: React.FC<SpendingOverviewChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getSpendingOverviewOptions(data);

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

export default SpendingOverviewChart;
