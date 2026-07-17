import Highcharts from "highcharts";
import { CHART_COLORS } from "../common/chartColors";
import { currencyAxisFormatter, formatCurrency } from "../common/chartUtils";

export interface AllocationItem {
  name: string;
  value: number;
  color?: string;
}

export function getAllocationPieOptions(
  data: AllocationItem[],
): Highcharts.Options {
  return {
    chart: { type: "pie" },
    title: { text: undefined },
    tooltip: {
      pointFormat:
        "<b>{point.percentage:.1f}%</b><br/>Value: <b>₹{point.y:,.0f}</b>",
    },
    plotOptions: {
      pie: {
        innerSize: "50%",
        dataLabels: {
          format: "<b>{point.name}</b><br/>{point.percentage:.1f}%",
        },
      },
    },
    series: [
      {
        name: "Allocation",
        type: "pie",
        data: data.map((item, i) => ({
          name: item.name,
          y: item.value,
          color:
            item.color ??
            CHART_COLORS.categorical[i % CHART_COLORS.categorical.length],
        })),
      },
    ],
  };
}

export interface PerformanceLineData {
  categories: string[];
  portfolio: number[];
  benchmark?: number[];
}

export function getPerformanceLineOptions(
  data: PerformanceLineData,
): Highcharts.Options {
  const series: Highcharts.SeriesOptionsType[] = [
    {
      name: "Portfolio",
      type: "line",
      data: data.portfolio,
      color: CHART_COLORS.primary,
      lineWidth: 2.5,
    },
  ];

  if (data.benchmark) {
    series.push({
      name: "Benchmark",
      type: "line",
      data: data.benchmark,
      color: CHART_COLORS.text.muted,
      dashStyle: "ShortDash",
      lineWidth: 1.5,
    });
  }

  return {
    chart: { type: "line" },
    title: { text: undefined },
    xAxis: { categories: data.categories },
    yAxis: {
      title: { text: "Value" },
      labels: { formatter: currencyAxisFormatter },
    },
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.Point) {
        const points = this.points ?? [];
        let s = `<b>${points[0]?.x}</b>`;
        points.forEach((p: Highcharts.Point) => {
          s += `<br/><span style="color:${p.color}">\u25CF</span> ${p.series.name}: <b>${formatCurrency(p.y ?? 0)}</b>`;
        });
        return s;
      },
    },
    series,
  };
}

export interface AssetClassItem {
  name: string;
  value: number;
  color?: string;
}

export function getAssetClassOptions(
  data: AssetClassItem[],
): Highcharts.Options {
  return {
    chart: { type: "treemap" },
    title: { text: undefined },
    colorAxis: {
      minColor: CHART_COLORS.primaryLight,
      maxColor: CHART_COLORS.primaryDark,
    },
    tooltip: {
      pointFormat: "<b>{point.name}</b>: ₹{point.value:,.0f}",
    },
    series: [
      {
        name: "Asset Classes",
        type: "treemap",
        layoutAlgorithm: "squarified",
        data: data.map((item, i) => ({
          name: item.name,
          value: item.value,
          color:
            item.color ??
            CHART_COLORS.categorical[i % CHART_COLORS.categorical.length],
          colorValue: item.value,
        })),
      },
    ],
  };
}

export interface RebalanceData {
  categories: string[];
  current: number[];
  target: number[];
}

export function getRebalanceOptions(data: RebalanceData): Highcharts.Options {
  return {
    chart: { type: "bar" },
    title: { text: undefined },
    xAxis: { categories: data.categories },
    yAxis: {
      title: { text: "Allocation (%)" },
      labels: { format: "{value}%" },
      max: 100,
    },
    tooltip: {
      shared: true,
      valueSuffix: "%",
    },
    plotOptions: {
      bar: {
        groupPadding: 0.15,
        pointPadding: 0.05,
        borderRadius: 3,
      },
    },
    series: [
      {
        name: "Current",
        type: "bar",
        data: data.current,
        color: CHART_COLORS.primary,
      },
      {
        name: "Target",
        type: "bar",
        data: data.target,
        color: CHART_COLORS.secondary,
      },
    ],
  };
}
