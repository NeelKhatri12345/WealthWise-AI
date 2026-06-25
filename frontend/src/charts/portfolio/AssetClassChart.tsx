import React from 'react';
import BaseChart from '../common/BaseChart';
import { getAssetClassOptions, type AssetClassItem } from './chartOptions';

interface AssetClassChartProps {
  data: AssetClassItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const AssetClassChart: React.FC<AssetClassChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getAssetClassOptions(data);

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

export default AssetClassChart;
