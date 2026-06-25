import React from 'react';
import BaseChart from '../common/BaseChart';
import { getRiskGaugeOptions, type RiskGaugeData } from './chartOptions';

interface RiskGaugeChartProps {
  data: RiskGaugeData;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const RiskGaugeChart: React.FC<RiskGaugeChartProps> = ({
  data,
  height = 300,
  loading,
  error,
  className,
}) => {
  const options = getRiskGaugeOptions(data);

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

export default RiskGaugeChart;
