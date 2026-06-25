import React from 'react';
import BaseChart from '../common/BaseChart';
import { getFactorBarOptions, type FactorBarData } from './chartOptions';

interface FactorBarChartProps {
  data: FactorBarData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const FactorBarChart: React.FC<FactorBarChartProps> = ({
  data,
  height = 300,
  loading,
  error,
  className,
}) => {
  const options = getFactorBarOptions(data);

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

export default FactorBarChart;
