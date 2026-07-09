import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { useAppDispatch } from "@/store";
import { deletePortfolioHoldingThunk } from "@/store/slices/portfolioHoldingSlice";
import type { PortfolioHolding } from "@/services/api/portfolioHolding.api";

interface DeleteHoldingDialogProps {
  holding: PortfolioHolding;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteHoldingDialog({
  holding,
  isOpen,
  onClose,
}: DeleteHoldingDialogProps) {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deletePortfolioHoldingThunk(holding.id)).unwrap();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Holding"
      message={`Are you sure you want to delete "${holding.assetName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      isLoading={isDeleting}
    />
  );
}
