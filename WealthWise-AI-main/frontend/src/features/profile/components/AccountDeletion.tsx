import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from "@/components/ui";

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
    <Card className="border border-red-200 bg-red-50/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-900">Danger Zone</CardTitle>
        <CardDescription className="text-red-700">
          Permanently delete your account and all associated personal finance data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-red-800">
        <p>
          Deleting your account is permanent and cannot be undone. All your statements,
          transactions, health scores, and coaching sessions will be deleted immediately.
        </p>

        {!showConfirm ? (
          <Button
            variant="danger"
            onClick={() => setShowConfirm(true)}
          >
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="font-semibold">
              Please type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded border border-red-200 select-all">DELETE</span> to confirm:
            </p>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              disabled={isDeleting}
              className="border-red-300 focus:border-red-500 focus:ring-red-500 bg-white"
            />
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || isDeleting}
                isLoading={isDeleting}
              >
                Permanently Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
