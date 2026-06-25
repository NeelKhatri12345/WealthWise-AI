import { NotificationItem } from './NotificationItem';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
}

export const NotificationList = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationListProps) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">No notifications</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              {...notification}
              onMarkRead={() => onMarkRead?.(notification.id)}
              onDelete={() => onDelete?.(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
