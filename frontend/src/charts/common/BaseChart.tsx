import React, { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsSolidGauge from 'highcharts/modules/solid-gauge';
import HighchartsTreemap from 'highcharts/modules/treemap';
import { mergeWithDefaults } from './chartDefaults';

HighchartsMore(Highcharts);
HighchartsSolidGauge(Highcharts);
HighchartsTreemap(Highcharts);

export interface BaseChartProps {
  options: Highcharts.Options;
  type?: string;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

const BaseChart: React.FC<BaseChartProps> = ({
  options,
  type,
  height = 400,
  loading = false,
  error = null,
  className = '',
}) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (chart) {
      if (loading) {
        chart.showLoading('Loading data...');
      } else {
        chart.hideLoading();
      }
    }
  }, [loading]);

  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.chart?.reflow();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-xl ${className}`}
        style={{ height }}
      >
        <div className="text-center px-4">
          <svg
            className="w-10 h-10 text-red-400 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-600 font-medium">
            Failed to load chart
          </p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const mergedOptions = mergeWithDefaults({
    ...options,
    chart: {
      ...options.chart,
      type: type ?? options.chart?.type,
      height,
    },
  });

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        </div>
      )}
      <HighchartsReact
        highcharts={Highcharts}
        options={mergedOptions}
        ref={chartRef}
      />
    </div>
  );
};

export default BaseChart;
