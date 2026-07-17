import { useRef, useEffect } from "react";
import Highcharts from "highcharts";

interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

interface RevenueChartProps {
  data: RevenuePoint[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: "column", height: 280 },
      title: { text: undefined },
      xAxis: { categories: data.map((d) => d.month) },
      yAxis: {
        title: { text: undefined },
        labels: {
          formatter: function () {
            return "$" + Highcharts.numberFormat(this.value as number, 0);
          },
        },
      },
      series: [
        {
          name: "Revenue",
          data: data.map((d) => d.revenue),
          type: "column",
          color: "#10B981",
        },
        {
          name: "Target",
          data: data.map((d) => d.target),
          type: "spline",
          color: "#6B7280",
          dashStyle: "Dash",
        },
      ],
      credits: { enabled: false },
    });

    return () => {
      chart.destroy();
    };
  }, [data]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No data available
        </p>
      ) : (
        <div ref={chartRef} />
      )}
    </div>
  );
};
