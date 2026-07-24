import React from "react";
import BaseChart from "../common/BaseChart";
import {
  getDailyTrendOptions,
  getHealthScoreTrendOptions,
  getRiskProfileDistributionOptions,
  type DailyTrendData,
  type HealthScoreTrendData,
  type RiskProfileDistributionData,
} from "./chartOptions";

interface ChartCommonProps {
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

interface DailyTrendChartProps extends ChartCommonProps {
  data: DailyTrendData;
  seriesName: string;
  color: string;
  yAxisTitle: string;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  data,
  seriesName,
  color,
  yAxisTitle,
  height = 280,
  loading,
  error,
  className,
}) => (
  <BaseChart
    options={getDailyTrendOptions(data, seriesName, color, yAxisTitle)}
    height={height}
    loading={loading}
    error={error}
    className={className}
  />
);

interface HealthScoreTrendChartProps extends ChartCommonProps {
  data: HealthScoreTrendData;
}

export const HealthScoreTrendChart: React.FC<HealthScoreTrendChartProps> = ({
  data,
  height = 280,
  loading,
  error,
  className,
}) => (
  <BaseChart
    options={getHealthScoreTrendOptions(data)}
    height={height}
    loading={loading}
    error={error}
    className={className}
  />
);

interface RiskProfileChartProps extends ChartCommonProps {
  data: RiskProfileDistributionData;
}

export const RiskProfileChart: React.FC<RiskProfileChartProps> = ({
  data,
  height = 280,
  loading,
  error,
  className,
}) => (
  <BaseChart
    options={getRiskProfileDistributionOptions(data)}
    height={height}
    loading={loading}
    error={error}
    className={className}
  />
);
