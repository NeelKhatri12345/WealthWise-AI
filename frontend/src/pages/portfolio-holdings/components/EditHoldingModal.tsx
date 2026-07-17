import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAppDispatch } from "@/store";
import { updatePortfolioHoldingThunk } from "@/store/slices/portfolioHoldingSlice";
import type { PortfolioHolding } from "@/services/api/portfolioHolding.api";
import { ASSET_TYPE_OPTIONS } from "../constants";

interface EditHoldingModalProps {
  holding: PortfolioHolding;
  isOpen: boolean;
  onClose: () => void;
}

export function EditHoldingModal({ holding, isOpen, onClose }: EditHoldingModalProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    assetName: holding.assetName,
    assetType: holding.assetType,
    symbol: holding.symbol || "",
    quantity: String(holding.quantity),
    averageBuyPrice: String(holding.averageBuyPrice),
    currentPrice: String(holding.currentPrice),
    purchaseDate: holding.purchaseDate,
    notes: holding.notes || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await dispatch(
        updatePortfolioHoldingThunk({
          id: holding.id,
          input: {
            assetName: form.assetName,
            assetType: form.assetType,
            symbol: form.symbol || undefined,
            quantity: parseFloat(form.quantity),
            averageBuyPrice: parseFloat(form.averageBuyPrice),
            currentPrice: parseFloat(form.currentPrice),
            purchaseDate: form.purchaseDate,
            notes: form.notes || undefined,
          },
        }),
      ).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to update holding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Holding" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-wealth-danger p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <Input
          label="Asset Name"
          required
          value={form.assetName}
          onChange={(e) => setForm({ ...form, assetName: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Asset Type"
            required
            options={ASSET_TYPE_OPTIONS}
            value={form.assetType}
            onChange={(e) => setForm({ ...form, assetType: e.target.value })}
          />
          <Input
            label="Symbol"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Quantity"
            type="number"
            step="0.0001"
            min="0.0001"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <Input
            label="Average Buy Price"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.averageBuyPrice}
            onChange={(e) => setForm({ ...form, averageBuyPrice: e.target.value })}
          />
          <Input
            label="Current Price"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.currentPrice}
            onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
          />
        </div>

        <Input
          label="Purchase Date"
          type="date"
          required
          value={form.purchaseDate}
          onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-wealth-border px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
