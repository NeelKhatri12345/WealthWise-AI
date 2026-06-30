interface SystemStat {
  label: string;
  value: string | number;
  status: "healthy" | "warning" | "critical";
  icon?: React.ReactNode;
}
interface SystemOverviewProps {
  stats: SystemStat[];
}
export declare const SystemOverview: ({
  stats,
}: SystemOverviewProps) => import("react").JSX.Element;
export {};
