import Highcharts from 'highcharts';
import { CHART_COLORS } from '../common/chartColors';
import { currencyAxisFormatter, formatCurrency } from '../common/chartUtils';

export interface SpendingOverviewData {
  categories: string[];
  data: number[];
}

export function getSpendingOverviewOptions(
  data: SpendingOverviewData
): Highcharts.Options {
  return {
    chart: { type: 'area' },
    title: { text: undefined },
    xAxis: {
      categories: data.categories,
      crosshair: true,
    },
    yAxis: {
      title: { text: 'Amount' },
      labels: { formatter: currencyAxisFormatter },
    },
    tooltip: {
      formatter() {
        const point = this as unknown as Highcharts.TooltipFormatterContextObject;
        return `<b>${point.x}</b><br/>Spending: <b>${formatCurrency(point.y ?? 0)}</b>`;
      },
    },
    series: [
      {
        name: 'Spending',
        type: 'area',
        data: data.data,
        color: CHART_COLORS.primary,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, `${CHART_COLORS.primary}33`],
            [1, `${CHART_COLORS.primary}05`],
          ],
        },
      },
    ],
  };
}

export interface IncomeVsExpenseData {
  categories: string[];
  income: number[];
  expense: number[];
}

export function getIncomeVsExpenseOptions(
  data: IncomeVsExpenseData
): Highcharts.Options {
  return {
    chart: { type: 'column' },
    title: { text: undefined },
    xAxis: { categories: data.categories, crosshair: true },
    yAxis: {
      title: { text: 'Amount' },
      labels: { formatter: currencyAxisFormatter },
    },
    tooltip: {
      shared: true,
      formatter() {
        const points = (this as unknown as Highcharts.TooltipFormatterContextObject).points ?? [];
        let s = `<b>${points[0]?.x}</b>`;
        points.forEach((p) => {
          s += `<br/><span style="color:${p.color}">\u25CF</span> ${p.series.name}: <b>${formatCurrency(p.y ?? 0)}</b>`;
        });
        return s;
      },
    },
    plotOptions: {
      column: { groupPadding: 0.15, pointPadding: 0.05 },
    },
    series: [
      {
        name: 'Income',
        type: 'column',
        data: data.income,
        color: CHART_COLORS.success,
      },
      {
        name: 'Expense',
        type: 'column',
        data: data.expense,
        color: CHART_COLORS.danger,
      },
    ],
  };
}

export interface CategoryDistributionItem {
  name: string;
  value: number;
  color?: string;
}

export function getCategoryDistributionOptions(
  data: CategoryDistributionItem[]
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
        innerSize: '55%',
        dataLabels: {
          format: '<b>{point.name}</b>: {point.percentage:.1f}%',
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

export interface SavingsRateData {
  categories: string[];
  rates: number[];
}

export function getSavingsRateOptions(
  data: SavingsRateData
): Highcharts.Options {
  return {
    chart: { type: 'line' },
    title: { text: undefined },
    xAxis: { categories: data.categories },
    yAxis: {
      title: { text: 'Savings Rate (%)' },
      labels: { format: '{value}%' },
      min: 0,
      max: 100,
      plotLines: [
        {
          value: 20,
          color: CHART_COLORS.warning,
          dashStyle: 'Dash',
          width: 1,
          label: {
            text: 'Recommended (20%)',
            style: { color: CHART_COLORS.warning, fontSize: '10px' },
          },
        },
      ],
    },
    tooltip: {
      formatter() {
        const point = this as unknown as Highcharts.TooltipFormatterContextObject;
        return `<b>${point.x}</b><br/>Savings Rate: <b>${(point.y ?? 0).toFixed(1)}%</b>`;
      },
    },
    series: [
      {
        name: 'Savings Rate',
        type: 'line',
        data: data.rates,
        color: CHART_COLORS.secondary,
        marker: { enabled: true, radius: 4 },
      },
    ],
  };
}
