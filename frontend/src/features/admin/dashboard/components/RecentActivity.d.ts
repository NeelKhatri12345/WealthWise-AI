interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: "user" | "system" | "security";
}
interface RecentActivityProps {
  activities: ActivityItem[];
}
export declare const RecentActivity: ({
  activities,
}: RecentActivityProps) => import("react").JSX.Element;
export {};
