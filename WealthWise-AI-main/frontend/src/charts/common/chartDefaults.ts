import Highcharts from "highcharts";
import { CHART_COLORS } from "./chartColors";

export const defaultChartOptions: Highcharts.Options = {
  chart: {
    style: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    backgroundColor: CHART_COLORS.background,
    spacingTop: 16,
    spacingRight: 16,
    spacingBottom: 16,
    spacingLeft: 16,
  },

  colors: [...CHART_COLORS.categorical],

  title: {
    style: {
      color: CHART_COLORS.text.primary,
      fontSize: "16px",
      fontWeight: "600",
    },
  },

  subtitle: {
    style: {
      color: CHART_COLORS.text.secondary,
      fontSize: "13px",
      fontWeight: "400",
    },
  },

  xAxis: {
    labels: {
      style: {
        color: CHART_COLORS.text.secondary,
        fontSize: "11px",
      },
    },
    lineColor: CHART_COLORS.border,
    tickColor: CHART_COLORS.border,
    gridLineColor: CHART_COLORS.border,
  },

  yAxis: {
    labels: {
      style: {
        color: CHART_COLORS.text.secondary,
        fontSize: "11px",
      },
    },
    gridLineColor: CHART_COLORS.border,
    title: {
      style: {
        color: CHART_COLORS.text.secondary,
        fontSize: "12px",
        fontWeight: "500",
      },
    },
  },

  legend: {
    itemStyle: {
      color: CHART_COLORS.text.primary,
      fontSize: "12px",
      fontWeight: "500",
    },
    itemHoverStyle: {
      color: CHART_COLORS.primaryDark,
    },
    itemHiddenStyle: {
      color: CHART_COLORS.text.muted,
    },
  },

  tooltip: {
    backgroundColor: CHART_COLORS.text.primary,
    borderColor: "transparent",
    borderRadius: 8,
    shadow: true,
    style: {
      color: "#ffffff",
      fontSize: "12px",
    },
  },

  plotOptions: {
    series: {
      animation: {
        duration: 600,
      },
      borderWidth: 0,
    },
    area: {
      fillOpacity: 0.15,
      marker: { enabled: false, radius: 3 },
      lineWidth: 2,
    },
    line: {
      marker: { enabled: false, radius: 3 },
      lineWidth: 2,
    },
    spline: {
      marker: { enabled: false, radius: 3 },
      lineWidth: 2,
    },
    column: {
      borderRadius: 4,
    },
    bar: {
      borderRadius: 4,
    },
    pie: {
      allowPointSelect: true,
      cursor: "pointer",
      borderWidth: 2,
      borderColor: CHART_COLORS.background,
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "11px",
          fontWeight: "500",
          color: CHART_COLORS.text.primary,
          textOutline: "none",
        },
      },
    },
  },

  credits: {
    enabled: false,
  },

  responsive: {
    rules: [
      {
        condition: { maxWidth: 500 },
        chartOptions: {
          legend: {
            layout: "horizontal",
            align: "center",
            verticalAlign: "bottom",
          },
          chart: {
            spacingTop: 8,
            spacingRight: 8,
            spacingBottom: 8,
            spacingLeft: 8,
          },
        },
      },
    ],
  },
};

export function mergeWithDefaults(
  options: Highcharts.Options,
): Highcharts.Options {
  return Highcharts.merge(defaultChartOptions, options) as Highcharts.Options;
}
