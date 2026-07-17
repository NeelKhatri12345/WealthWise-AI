export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export interface DateRange {
  start: string;
  end: string;
}
