import Highcharts from "highcharts";
export interface ScoreGaugeData {
  score: number;
  maxScore?: number;
  label?: string;
}
export declare function getScoreGaugeOptions(
  data: ScoreGaugeData,
): Highcharts.Options;
export interface ScoreHistoryData {
  categories: string[];
  scores: number[];
}
export declare function getScoreHistoryOptions(
  data: ScoreHistoryData,
): Highcharts.Options;
export interface MetricRadarData {
  categories: string[];
  values: number[];
  maxValue?: number;
}
export declare function getMetricRadarOptions(
  data: MetricRadarData,
): Highcharts.Options;
export interface FactorBarData {
  factors: {
    name: string;
    value: number;
    color?: string;
  }[];
}
export declare function getFactorBarOptions(
  data: FactorBarData,
): Highcharts.Options;
