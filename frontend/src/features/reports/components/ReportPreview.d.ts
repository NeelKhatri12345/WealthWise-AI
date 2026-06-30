interface ReportSection {
  title: string;
  content: string;
}
interface ReportPreviewProps {
  title: string;
  dateRange: string;
  sections: ReportSection[];
  onClose: () => void;
  onDownload?: () => void;
}
export declare const ReportPreview: ({
  title,
  dateRange,
  sections,
  onClose,
  onDownload,
}: ReportPreviewProps) => import("react").JSX.Element;
export {};
