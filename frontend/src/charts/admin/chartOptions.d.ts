import Highcharts from "highcharts";
export interface UserGrowthData {
  categories: string[];
  newUsers: number[];
  totalUsers: number[];
}
export declare function getUserGrowthOptions(
  data: UserGrowthData,
): Highcharts.Options;
export interface SystemLoadData {
  categories: string[];
  cpu: number[];
  memory: number[];
}
export declare function getSystemLoadOptions(
  data: SystemLoadData,
): Highcharts.Options;
export interface ApiResponseTimeData {
  categories: string[];
  avgMs: number[];
  p95Ms: number[];
  p99Ms: number[];
}
export declare function getApiResponseTimeOptions(
  data: ApiResponseTimeData,
): Highcharts.Options;
export interface ErrorRateData {
  categories: string[];
  errors: number[];
  totalRequests: number[];
}
export declare function getErrorRateOptions(
  data: ErrorRateData,
): Highcharts.Options;
