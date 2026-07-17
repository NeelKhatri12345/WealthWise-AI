interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

const typeStyles = {
  info: { dot: "bg-blue-500", bg: "bg-blue-50" },
  warning: { dot: "bg-yellow-500", bg: "bg-yellow-50" },
  success: { dot: "bg-green-500", bg: "bg-green-50" },
  error: { dot: "bg-red-500", bg: "bg-red-50" },
};

export const NotificationItem = ({
  title,
  message,
  type,
  read,
  createdAt,
  onMarkRead,
  onDelete,
}: NotificationItemProps) => {
  const style = typeStyles[type];

  return (
    <div
      className={`flex items-start gap-3 px-6 py-4 ${!read ? style.bg : "hover:bg-gray-50"} transition-colors`}
    >
      <div
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!read ? style.dot : "bg-transparent"}`}
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${!read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-sm text-gray-600 truncate">{message}</p>
        <p className="mt-1 text-xs text-gray-400">{createdAt}</p>
      </div>

      <div className="flex shrink-0 gap-2">
        {!read && onMarkRead && (
          <button
            onClick={onMarkRead}
            className="text-xs text-indigo-600 hover:text-indigo-500"
          >
            Mark read
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
