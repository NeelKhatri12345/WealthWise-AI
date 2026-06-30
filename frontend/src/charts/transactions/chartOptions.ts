import Highcharts from 'highcharts';
import { CHART_COLORS } from '../common/chartColors';
import { currencyAxisFormatter, formatCurrency } from '../common/chartUtils';

export interface MonthlyTrendData {
  categories: string[];
  amounts: number[];
  counts: number[];
}

export function getMonthlyTrendOptions(
  data: MonthlyTrendData
): Highcharts.Options {
  return {
    chart: { type: 'line' },
    title: { text: undefined },
    xAxis: { categories: data.categories, crosshair: true },
    yAxis: [
      {
        title: { text: 'Amount' },
        labels: { formatter: currencyAxisFormatter },
      },
      {
        title: { text: 'Transactions' },
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.Point) {
        const points = this.points ?? [];
        let s = `<b>${points[0]?.x}</b>`;
        points.forEach((p: Highcharts.Point) => {
          const val =
            p.series.name === 'Amount'
              ? formatCurrency(p.y ?? 0)
              : String(p.y ?? 0);
          s += `<br/><span style="color:${p.color}">\u25CF</span> ${p.series.name}: <b>${val}</b>`;
        });
        return s;
      },
    },
    series: [
      {
        name: 'Amount',
        type: 'line',
        data: data.amounts,
        color: CHART_COLORS.primary,
        yAxis: 0,
      },
      {
        name: 'Transactions',
        type: 'line',
        data: data.counts,
        color: CHART_COLORS.secondary,
        yAxis: 1,
        dashStyle: 'ShortDash',
      },
    ],
  };
}

export interface CategoryPieItem {
  name: string;
  value: number;
  color?: string;
}

export function getCategoryPieOptions(
  data: CategoryPieItem[]
): Highcharts.Options {
  return {
    chart: { type: 'pie' },
    title: { text: undefined },
    tooltip: {
      pointFormat:
        '<b>{point.percentage:.1f}%</b><br/>Amount: <b>₹{point.y:,.0f}</b>',
    },
    plotOptions: {
      pie: {
        dataLabels: {
          format: '<b>{point.name}</b>: ₹{point.y:,.0f}',
        },
      },
    },
    series: [
      {
        name: 'Category',
        type: 'pie',
        data: data.map((item, i) => ({
          name: item.name,
          y: item.value,
          color: item.color ?? CHART_COLORS.categorical[i % CHART_COLORS.categorical.length],
        })),
      },
    ],
  };
}

export interface DailySpendingData {
  categories: string[];
  amounts: number[];
}

export function getDailySpendingOptions(
  data: DailySpendingData
): Highcharts.Options {
  return {
    chart: { type: 'column' },
    title: { text: undefined },
    xAxis: {
      categories: data.categories,
      crosshair: true,
      labels: { rotation: -45 },
    },
    yAxis: {
      title: { text: 'Amount' },
      labels: { formatter: currencyAxisFormatter },
    },
    tooltip: {
      formatter: function (this: Highcharts.Point) {
        return `<b>${this.x}</b><br/>Spent: <b>${formatCurrency(this.y ?? 0)}</b>`;
      },
    },
    plotOptions: {
      column: {
        color: CHART_COLORS.primary,
        pointPadding: 0.05,
        groupPadding: 0.1,
      },
    },
    series: [
      {
        name: 'Daily Spending',
        type: 'column',
        data: data.amounts,
        color: CHART_COLORS.primary,
      },
    ],
  };
}
