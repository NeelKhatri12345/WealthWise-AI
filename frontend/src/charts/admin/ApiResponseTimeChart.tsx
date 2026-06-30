import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getApiResponseTimeOptions,
  type ApiResponseTimeData,
} from "./chartOptions";

interface ApiResponseTimeChartProps {
  data: ApiResponseTimeData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const ApiResponseTimeChart: React.FC<ApiResponseTimeChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getApiResponseTimeOptions(data);

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

export default ApiResponseTimeChart;
