import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';

interface ActiveUsersPoint {
  time: string;
  count: number;
}

interface ActiveUsersChartProps {
  data: ActiveUsersPoint[];
}

export const ActiveUsersChart = ({ data }: ActiveUsersChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: 'areaspline', height: 280 },
      title: { text: undefined },
      xAxis: { categories: data.map((d) => d.time) },
      yAxis: { title: { text: undefined }, min: 0 },
      series: [
        {
          name: 'Active Users',
          data: data.map((d) => d.count),
          color: '#8B5CF6',
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(139, 92, 246, 0.3)'],
              [1, 'rgba(139, 92, 246, 0.0)'],
            ],
          },
          type: 'areaspline',
        },
      ],
      credits: { enabled: false },
      legend: { enabled: false },
    });

    return () => { chart.destroy(); };
  }, [data]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Active Users</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No data available</p>
      ) : (
        <div ref={chartRef} />
      )}
    </div>
  );
};
