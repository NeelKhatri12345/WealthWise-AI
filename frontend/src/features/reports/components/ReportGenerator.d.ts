type ReportFormValues = {
  type: "custom" | "monthly" | "quarterly" | "annual";
  dateFrom: string;
  dateTo: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
};
interface ReportGeneratorProps {
  onGenerate: (data: ReportFormValues) => void;
  isLoading?: boolean;
}
export declare const ReportGenerator: ({
  onGenerate,
  isLoading,
}: ReportGeneratorProps) => import("react").JSX.Element;
export {};
