import React from "react";
import { type UserGrowthData } from "./chartOptions";
interface UserGrowthChartProps {
  data: UserGrowthData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}
declare const UserGrowthChart: React.FC<UserGrowthChartProps>;
export default UserGrowthChart;
