import React from "react";
import BaseChart from "../common/BaseChart";
import { getRiskTrendOptions, type RiskTrendData } from "./chartOptions";

interface RiskTrendChartProps {
  data: RiskTrendData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getRiskTrendOptions(data);

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

export default RiskTrendChart;
