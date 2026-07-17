import React from "react";
import BaseChart from "../common/BaseChart";
import { getRebalanceOptions, type RebalanceData } from "./chartOptions";

interface RebalanceChartProps {
  data: RebalanceData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const RebalanceChart: React.FC<RebalanceChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getRebalanceOptions(data);

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

export default RebalanceChart;
