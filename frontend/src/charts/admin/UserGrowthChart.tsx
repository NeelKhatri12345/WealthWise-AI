import React from "react";
import BaseChart from "../common/BaseChart";
import { getUserGrowthOptions, type UserGrowthData } from "./chartOptions";

interface UserGrowthChartProps {
  data: UserGrowthData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getUserGrowthOptions(data);

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

export default UserGrowthChart;
