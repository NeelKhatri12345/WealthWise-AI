import { useState } from "react";

interface AccountDeletionProps {
  onDelete: () => Promise<void>;
}

export const AccountDeletion = ({ onDelete }: AccountDeletionProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
      <p className="mt-1 text-sm text-red-700">
        Permanently delete your account and all associated data. This action
        cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          Delete Account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-red-700">
            Type <strong>DELETE</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-red-500"
            placeholder="Type DELETE"
          />
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
