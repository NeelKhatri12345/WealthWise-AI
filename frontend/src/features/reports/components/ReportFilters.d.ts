interface ReportFiltersState {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}
interface ReportFiltersProps {
  filters: ReportFiltersState;
  onFilterChange: (filters: ReportFiltersState) => void;
  onReset: () => void;
}
export declare const ReportFilters: ({
  filters,
  onFilterChange,
  onReset,
}: ReportFiltersProps) => import("react").JSX.Element;
export {};
