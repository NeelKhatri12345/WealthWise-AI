import { useRef, useEffect } from "react";
import Highcharts from "highcharts";

interface AllocationSlice {
  name: string;
  percentage: number;
  value: number;
  color?: string;
}

interface AllocationChartProps {
  data: AllocationSlice[];
  title?: string;
}

export const AllocationChart = ({
  data,
  title = "Portfolio Allocation",
}: AllocationChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: "pie", height: 320 },
      title: { text: undefined },
      tooltip: {
        pointFormat: "{point.percentage:.1f}% (${point.value:,.0f})",
      },
      plotOptions: {
        pie: {
          innerSize: "60%",
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.percentage:.1f}%",
          },
        },
      },
      series: [
        {
          name: "Allocation",
          type: "pie",
          data: data.map((d) => ({
            name: d.name,
            y: d.percentage,
            value: d.value,
            color: d.color,
          })),
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
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No allocation data available
        </p>
      ) : (
        <div ref={chartRef} />
      )}
    </div>
  );
};
