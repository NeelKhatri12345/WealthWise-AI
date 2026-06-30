export interface ReportResponse {
  id: string;
  name: string;
  type: "monthly" | "quarterly" | "annual" | "custom";
  status: "generating" | "completed" | "failed";
  generatedAt: string;
  downloadUrl?: string;
  fileSize?: number;
}
export interface GenerateReportRequest {
  type: ReportResponse["type"];
  dateFrom: string;
  dateTo: string;
  sections?: string[];
}
export declare const reportApi: {
  generateReport(params: GenerateReportRequest): Promise<ReportResponse>;
  getReports(): Promise<ReportResponse[]>;
  downloadReport(id: string): Promise<Blob>;
};
