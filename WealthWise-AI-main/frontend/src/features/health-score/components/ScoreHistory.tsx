import { useRef, useEffect } from "react";
import Highcharts from "highcharts";

interface ScoreHistoryPoint {
  date: string;
  score: number;
}

interface ScoreHistoryProps {
  data: ScoreHistoryPoint[];
  title?: string;
}

export const ScoreHistory = ({
  data,
  title = "Score History",
}: ScoreHistoryProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = Highcharts.chart(chartRef.current, {
      chart: { type: "spline", height: 280 },
      title: { text: undefined },
      xAxis: {
        categories: data.map((d) => d.date),
        labels: { style: { color: "#6B7280" } },
      },
      yAxis: {
        title: { text: undefined },
        min: 0,
        max: 100,
        plotBands: [
          { from: 0, to: 25, color: "rgba(239, 68, 68, 0.05)" },
          { from: 25, to: 50, color: "rgba(245, 158, 11, 0.05)" },
          { from: 50, to: 75, color: "rgba(234, 179, 8, 0.05)" },
          { from: 75, to: 100, color: "rgba(16, 185, 129, 0.05)" },
        ],
      },
      series: [
        {
          name: "Health Score",
          data: data.map((d) => d.score),
          color: "#6366F1",
          type: "spline",
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
