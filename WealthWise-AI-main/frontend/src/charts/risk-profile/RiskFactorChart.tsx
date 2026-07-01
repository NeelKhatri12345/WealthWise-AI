import React from "react";
import BaseChart from "../common/BaseChart";
import { getRiskFactorOptions, type RiskFactorData } from "./chartOptions";

interface RiskFactorChartProps {
  data: RiskFactorData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const RiskFactorChart: React.FC<RiskFactorChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getRiskFactorOptions(data);

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

export default RiskFactorChart;
