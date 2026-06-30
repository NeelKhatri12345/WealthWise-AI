interface UserFiltersState {
  role?: string;
  status?: string;
  search?: string;
}
interface UserFiltersProps {
  filters: UserFiltersState;
  onFilterChange: (filters: UserFiltersState) => void;
  onReset: () => void;
}
export declare const UserFilters: ({
  filters,
  onFilterChange,
  onReset,
}: UserFiltersProps) => import("react").JSX.Element;
export {};
