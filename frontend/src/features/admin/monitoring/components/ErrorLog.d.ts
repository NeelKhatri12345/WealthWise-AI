interface ErrorEntry {
  id: string;
  message: string;
  source: string;
  timestamp: string;
  severity: "error" | "warning" | "critical";
  count: number;
}
interface ErrorLogProps {
  errors: ErrorEntry[];
  onViewDetail?: (id: string) => void;
}
export declare const ErrorLog: ({
  errors,
  onViewDetail,
}: ErrorLogProps) => import("react").JSX.Element;
export {};
