import { useRef, useEffect } from 'react';
import Highcharts from 'highcharts';

interface SpendingDataPoint {
  month: string;
  amount: number;
}

interface SpendingChartProps {
  data: SpendingDataPoint[];
  title?: string;
}

export const SpendingChart = ({ data, title = 'Monthly Spending' }: SpendingChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: 'areaspline', height: 300 },
      title: { text: undefined },
      xAxis: {
        categories: data.map((d) => d.month),
        labels: { style: { color: '#6B7280' } },
      },
      yAxis: {
        title: { text: undefined },
        labels: {
          formatter: function () {
            return '$' + Highcharts.numberFormat(this.value as number, 0, '.', ',');
          },
          style: { color: '#6B7280' },
        },
      },
      series: [
        {
          name: 'Spending',
          data: data.map((d) => d.amount),
          color: '#6366F1',
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(99, 102, 241, 0.3)'],
              [1, 'rgba(99, 102, 241, 0.0)'],
            ],
          },
          type: 'areaspline',
        },
      ],
      credits: { enabled: false },
      legend: { enabled: false },
    });

    return () => {
      chart.destroy();
    };
  }, [data]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div ref={chartRef} />
    </div>
  );
};
