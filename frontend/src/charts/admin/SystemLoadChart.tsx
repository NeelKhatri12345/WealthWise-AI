import React from "react";
import BaseChart from "../common/BaseChart";
import { getSystemLoadOptions, type SystemLoadData } from "./chartOptions";

interface SystemLoadChartProps {
  data: SystemLoadData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const SystemLoadChart: React.FC<SystemLoadChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getSystemLoadOptions(data);

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

export default SystemLoadChart;
