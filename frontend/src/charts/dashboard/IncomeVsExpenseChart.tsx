import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getIncomeVsExpenseOptions,
  type IncomeVsExpenseData,
} from "./chartOptions";

interface IncomeVsExpenseChartProps {
  data: IncomeVsExpenseData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getIncomeVsExpenseOptions(data);

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

export default IncomeVsExpenseChart;
