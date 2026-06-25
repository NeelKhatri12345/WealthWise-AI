import axiosInstance, { type ApiResponse } from './axiosInstance';

export interface ReportResponse {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  status: 'generating' | 'completed' | 'failed';
  generatedAt: string;
  downloadUrl?: string;
  fileSize?: number;
}

export interface GenerateReportRequest {
  type: ReportResponse['type'];
  dateFrom: string;
  dateTo: string;
  sections?: string[];
}

export const reportApi = {
  async generateReport(
    params: GenerateReportRequest
  ): Promise<ReportResponse> {
    const { data } = await axiosInstance.post<ApiResponse<ReportResponse>>(
      '/reports/generate',
      params
    );
    return data.data;
  },

  async getReports(): Promise<ReportResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<ReportResponse[]>>(
      '/reports'
    );
    return data.data;
  },

  async downloadReport(id: string): Promise<Blob> {
    const { data } = await axiosInstance.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },
};
