import React from 'react';
import BaseChart from '../common/BaseChart';
import { getScoreGaugeOptions, type ScoreGaugeData } from './chartOptions';

interface ScoreGaugeChartProps {
  data: ScoreGaugeData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const ScoreGaugeChart: React.FC<ScoreGaugeChartProps> = ({
  data,
  height = 300,
  loading,
  error,
  className,
}) => {
  const options = getScoreGaugeOptions(data);

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

export default ScoreGaugeChart;
