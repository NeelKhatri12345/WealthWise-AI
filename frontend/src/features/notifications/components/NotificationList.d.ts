interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}
interface NotificationListProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
}
export declare const NotificationList: ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationListProps) => import("react").JSX.Element;
export {};
