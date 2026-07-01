import { useRef, useEffect } from "react";
import Highcharts from "highcharts";

interface RiskHistoryPoint {
  date: string;
  score: number;
  level: string;
}

interface RiskHistoryProps {
  data: RiskHistoryPoint[];
  title?: string;
}

export const RiskHistory = ({
  data,
  title = "Risk Score History",
}: RiskHistoryProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: "area", height: 280 },
      title: { text: undefined },
      xAxis: {
        categories: data.map((d) => d.date),
        labels: { style: { color: "#6B7280" } },
      },
      yAxis: {
        title: { text: undefined },
        min: 0,
        max: 100,
      },
      series: [
        {
          name: "Risk Score",
          data: data.map((d) => d.score),
          color: "#F97316",
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "rgba(249, 115, 22, 0.3)"],
              [1, "rgba(249, 115, 22, 0.0)"],
            ],
          },
          type: "area",
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
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No history data available
        </p>
      ) : (
        <div ref={chartRef} />
      )}
    </div>
  );
};
