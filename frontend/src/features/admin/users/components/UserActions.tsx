interface UserActionsProps {
  userId: string;
  currentStatus: "active" | "inactive" | "banned";
  onActivate: (id: string) => void;
  onBan: (id: string) => void;
  onDelete: (id: string) => void;
}

export const UserActions = ({
  userId,
  currentStatus,
  onActivate,
  onBan,
  onDelete,
}: UserActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      {currentStatus !== "active" && (
        <button
          onClick={() => onActivate(userId)}
          className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
        >
          Activate
        </button>
      )}
      {currentStatus !== "banned" && (
        <button
          onClick={() => onBan(userId)}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          Ban
        </button>
      )}
      <button
        onClick={() => onDelete(userId)}
        className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        Delete
      </button>
    </div>
  );
};
