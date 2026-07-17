import React from "react";
import BaseChart from "../common/BaseChart";
import { getScoreHistoryOptions, type ScoreHistoryData } from "./chartOptions";

interface ScoreHistoryChartProps {
  data: ScoreHistoryData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getScoreHistoryOptions(data);

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

export default ScoreHistoryChart;
