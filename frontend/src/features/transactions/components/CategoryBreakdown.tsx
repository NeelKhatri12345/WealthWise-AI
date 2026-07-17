import { useRef, useEffect } from "react";
import Highcharts from "highcharts";

interface CategoryData {
  name: string;
  amount: number;
  color?: string;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  title?: string;
}

export const CategoryBreakdown = ({
  data,
  title = "Spending by Category",
}: CategoryBreakdownProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: "pie", height: 300 },
      title: { text: undefined },
      tooltip: {
        pointFormat: "<b>${point.y:,.0f}</b> ({point.percentage:.1f}%)",
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.1f}%",
          },
        },
      },
      series: [
        {
          name: "Spending",
          type: "pie",
          data: data.map((d) => ({
            name: d.name,
            y: d.amount,
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
          No category data available
        </p>
      ) : (
        <div ref={chartRef} />
      )}
    </div>
  );
};
