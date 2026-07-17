interface UserDetailProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive" | "banned";
    createdAt: string;
    lastLogin?: string;
    transactionCount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: "active" | "inactive" | "banned") => void;
}

export const UserDetail = ({
  user,
  isOpen,
  onClose,
  onStatusChange,
}: UserDetailProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium text-gray-900">{user.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium text-gray-900">{user.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm font-medium text-gray-900">
                {user.createdAt}
              </p>
            </div>
            {user.lastLogin && (
              <div>
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.lastLogin}
                </p>
              </div>
            )}
          </div>

          {onStatusChange && (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange("active")}
                disabled={user.status === "active"}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Activate
              </button>
              <button
                onClick={() => onStatusChange("banned")}
                disabled={user.status === "banned"}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Ban
              </button>
              <button
                onClick={() => onStatusChange("inactive")}
                disabled={user.status === "inactive"}
                className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Deactivate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
