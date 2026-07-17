import type Highcharts from "highcharts";

export const defaultChartOptions: Highcharts.Options = {
  chart: {
    style: {
      fontFamily: "Inter, system-ui, sans-serif",
    },
    backgroundColor: "transparent",
  },
  title: {
    style: {
      color: "#1e293b",
      fontSize: "16px",
      fontWeight: "600",
    },
  },
  colors: [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#f97316",
  ],
  credits: {
    enabled: false,
  },
  legend: {
    itemStyle: {
      color: "#64748b",
      fontWeight: "normal",
    },
  },
  tooltip: {
    borderRadius: 8,
    shadow: true,
  },
};
