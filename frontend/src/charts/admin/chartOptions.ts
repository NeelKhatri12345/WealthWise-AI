import Highcharts from "highcharts";
import { CHART_COLORS } from "../common/chartColors";

export interface UserGrowthData {
  categories: string[];
  newUsers: number[];
  totalUsers: number[];
}

export function getUserGrowthOptions(data: UserGrowthData): Highcharts.Options {
  return {
    chart: { type: "area" },
    title: { text: undefined },
    xAxis: { categories: data.categories, crosshair: true },
    yAxis: [
      { title: { text: "New Users" } },
      { title: { text: "Total Users" }, opposite: true },
    ],
    tooltip: { shared: true },
    series: [
      {
        name: "New Users",
        type: "area",
        data: data.newUsers,
        color: CHART_COLORS.primary,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, `${CHART_COLORS.primary}33`],
            [1, `${CHART_COLORS.primary}05`],
          ],
        },
        yAxis: 0,
      },
      {
        name: "Total Users",
        type: "line",
        data: data.totalUsers,
        color: CHART_COLORS.secondary,
        yAxis: 1,
        dashStyle: "ShortDash",
      },
    ],
  };
}

export interface SystemLoadData {
  categories: string[];
  cpu: number[];
  memory: number[];
}

export function getSystemLoadOptions(data: SystemLoadData): Highcharts.Options {
  return {
    chart: { type: "line" },
    title: { text: undefined },
    xAxis: { categories: data.categories, crosshair: true },
    yAxis: {
      title: { text: "Usage (%)" },
      min: 0,
      max: 100,
      labels: { format: "{value}%" },
      plotLines: [
        {
          value: 80,
          color: CHART_COLORS.danger,
          dashStyle: "Dash",
          width: 1,
          label: {
            text: "Warning (80%)",
            style: { color: CHART_COLORS.danger, fontSize: "10px" },
          },
        },
      ],
    },
    tooltip: {
      shared: true,
      valueSuffix: "%",
    },
    series: [
      {
        name: "CPU",
        type: "line",
        data: data.cpu,
        color: CHART_COLORS.primary,
      },
      {
        name: "Memory",
        type: "line",
        data: data.memory,
        color: CHART_COLORS.accent,
      },
    ],
  };
}

export interface ApiResponseTimeData {
  categories: string[];
  avgMs: number[];
  p95Ms: number[];
  p99Ms: number[];
}

export function getApiResponseTimeOptions(
  data: ApiResponseTimeData,
): Highcharts.Options {
  return {
    chart: { type: "line" },
    title: { text: undefined },
    xAxis: { categories: data.categories, crosshair: true },
    yAxis: {
      title: { text: "Response Time (ms)" },
      min: 0,
    },
    tooltip: {
      shared: true,
      valueSuffix: "ms",
    },
    series: [
      {
        name: "Average",
        type: "line",
        data: data.avgMs,
        color: CHART_COLORS.primary,
      },
      {
        name: "P95",
        type: "line",
        data: data.p95Ms,
        color: CHART_COLORS.warning,
        dashStyle: "ShortDash",
      },
      {
        name: "P99",
        type: "line",
        data: data.p99Ms,
        color: CHART_COLORS.danger,
        dashStyle: "Dot",
      },
    ],
  };
}

export interface ErrorRateData {
  categories: string[];
  errors: number[];
  totalRequests: number[];
}

export function getErrorRateOptions(data: ErrorRateData): Highcharts.Options {
  const errorRates = data.errors.map((e, i) =>
    data.totalRequests[i] > 0
      ? parseFloat(((e / data.totalRequests[i]) * 100).toFixed(2))
      : 0,
  );

  return {
    chart: { type: "column" },
    title: { text: undefined },
    xAxis: { categories: data.categories, crosshair: true },
    yAxis: [
      { title: { text: "Errors" }, min: 0 },
      {
        title: { text: "Error Rate (%)" },
        opposite: true,
        min: 0,
        labels: { format: "{value}%" },
      },
    ],
    tooltip: { shared: true },
    plotOptions: {
      column: { borderRadius: 3 },
    },
    series: [
      {
        name: "Errors",
        type: "column",
        data: data.errors,
        color: CHART_COLORS.danger,
        yAxis: 0,
      },
      {
        name: "Error Rate",
        type: "line",
        data: errorRates,
        color: CHART_COLORS.warning,
        yAxis: 1,
        tooltip: { valueSuffix: "%" },
        marker: { enabled: true, radius: 3 },
      },
    ],
  };
}
