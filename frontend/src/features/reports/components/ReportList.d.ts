interface Report {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  generatedAt: string;
  status: "ready" | "generating" | "failed";
}
interface ReportListProps {
  reports: Report[];
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}
export declare const ReportList: ({
  reports,
  onView,
  onDownload,
}: ReportListProps) => import("react").JSX.Element;
export {};
