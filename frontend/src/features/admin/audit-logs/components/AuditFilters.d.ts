interface AuditFiltersState {
  action?: string;
  user?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: "all" | "success" | "failure";
}
interface AuditFiltersProps {
  filters: AuditFiltersState;
  onFilterChange: (filters: AuditFiltersState) => void;
  onReset: () => void;
}
export declare const AuditFilters: ({
  filters,
  onFilterChange,
  onReset,
}: AuditFiltersProps) => import("react").JSX.Element;
export {};
