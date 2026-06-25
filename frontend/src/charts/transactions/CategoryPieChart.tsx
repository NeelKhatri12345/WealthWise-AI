import React from 'react';
import BaseChart from '../common/BaseChart';
import { getCategoryPieOptions, type CategoryPieItem } from './chartOptions';

interface CategoryPieChartProps {
  data: CategoryPieItem[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  height = 350,
  loading,
  error,
  className,
}) => {
  const options = getCategoryPieOptions(data);

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

export default CategoryPieChart;
