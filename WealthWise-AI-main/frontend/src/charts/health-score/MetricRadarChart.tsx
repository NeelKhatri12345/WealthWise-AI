import React from "react";
import BaseChart from "../common/BaseChart";
import { getMetricRadarOptions, type MetricRadarData } from "./chartOptions";

interface MetricRadarChartProps {
  data: MetricRadarData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const MetricRadarChart: React.FC<MetricRadarChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getMetricRadarOptions(data);

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

export default MetricRadarChart;
