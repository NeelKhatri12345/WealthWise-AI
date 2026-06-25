import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';

interface GrowthPoint {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface UserGrowthChartProps {
  data: GrowthPoint[];
}

export const UserGrowthChart = ({ data }: UserGrowthChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: 'column', height: 300 },
      title: { text: undefined },
      xAxis: { categories: data.map((d) => d.date) },
      yAxis: [
        { title: { text: 'New Users' } },
        { title: { text: 'Total Users' }, opposite: true },
      ],
      series: [
        { name: 'New Users', data: data.map((d) => d.newUsers), type: 'column', color: '#6366F1' },
        { name: 'Total Users', data: data.map((d) => d.totalUsers), type: 'spline', yAxis: 1, color: '#10B981' },
      ],
      credits: { enabled: false },
    });

    return () => { chart.destroy(); };
  }, [data]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">User Growth</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No data available</p>
      ) : (
        <div ref={chartRef} />
      )}
    </div>
  );
};
