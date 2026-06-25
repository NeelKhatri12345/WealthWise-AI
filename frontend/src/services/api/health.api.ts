import axiosInstance, { type ApiResponse } from './axiosInstance';

export interface HealthScoreResponse {
  score: number;
  tips: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface HealthHistoryItem {
  date: string;
  score: number;
}

export interface HealthMetricResponse {
  name: string;
  value: number;
  maxValue: number;
  status: 'good' | 'fair' | 'poor';
  description: string;
}

export const healthApi = {
  async getHealthScore(): Promise<HealthScoreResponse> {
    const { data } = await axiosInstance.get<
      ApiResponse<HealthScoreResponse>
    >('/health/score');
    return data.data;
  },

  async getHealthHistory(
    period: string = '6m'
  ): Promise<HealthHistoryItem[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<HealthHistoryItem[]>
    >('/health/history', { params: { period } });
    return data.data;
  },

  async getHealthMetrics(): Promise<HealthMetricResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<HealthMetricResponse[]>
    >('/health/metrics');
    return data.data;
  },
};
