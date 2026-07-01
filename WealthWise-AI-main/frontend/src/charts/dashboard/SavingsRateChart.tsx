import React from "react";
import BaseChart from "../common/BaseChart";
import { getSavingsRateOptions, type SavingsRateData } from "./chartOptions";

interface SavingsRateChartProps {
  data: SavingsRateData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const SavingsRateChart: React.FC<SavingsRateChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getSavingsRateOptions(data);

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

export default SavingsRateChart;
