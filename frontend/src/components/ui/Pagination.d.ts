interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}
export declare function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps): import("react").JSX.Element;
export {};
