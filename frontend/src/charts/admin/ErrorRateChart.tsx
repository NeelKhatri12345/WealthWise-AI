import React from "react";
import BaseChart from "../common/BaseChart";
import { getErrorRateOptions, type ErrorRateData } from "./chartOptions";

interface ErrorRateChartProps {
  data: ErrorRateData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const ErrorRateChart: React.FC<ErrorRateChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getErrorRateOptions(data);

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

export default ErrorRateChart;
