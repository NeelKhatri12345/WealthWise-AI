import React from 'react';
import BaseChart from '../common/BaseChart';
import {
  getBenchmarkComparisonOptions,
  type BenchmarkComparisonData,
} from './chartOptions';

interface BenchmarkComparisonChartProps {
  data: BenchmarkComparisonData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const BenchmarkComparisonChart: React.FC<BenchmarkComparisonChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getBenchmarkComparisonOptions(data);

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

export default BenchmarkComparisonChart;
