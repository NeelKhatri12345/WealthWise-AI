import { useState } from "react";
import { useAppSelector } from "@/store";
import type { PortfolioHolding } from "@/services/api/portfolioHolding.api";
import { EditHoldingModal } from "./EditHoldingModal";
import { DeleteHoldingDialog } from "./DeleteHoldingDialog";

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PortfolioHoldingsTable() {
  const { holdings, loading } = useAppSelector((state) => state.portfolioHoldings);
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);
  const [deletingHolding, setDeletingHolding] = useState<PortfolioHolding | null>(
    null,
  );

  return (
    <div className="flex flex-col h-full relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-wealth-border flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-wealth-border text-wealth-muted uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3 text-right">Average Price</th>
              <th className="px-4 py-3 text-right">Current Price</th>
              <th className="px-4 py-3 text-right">Current Value</th>
              <th className="px-4 py-3 text-right">Profit/Loss</th>
              <th className="px-4 py-3">Purchase Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wealth-border">
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-wealth-muted">
                  No portfolio holdings yet. Add your first holding to get started.
                </td>
              </tr>
            ) : (
              holdings.map((holding) => (
                <tr key={holding.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{holding.assetName}</p>
                    <p className="text-xs text-wealth-muted">{holding.assetType}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{holding.symbol || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {holding.quantity.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatCurrency(holding.averageBuyPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(holding.currentValue)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      holding.profitLoss >= 0
                        ? "text-wealth-success"
                        : "text-wealth-danger"
                    }`}
                  >
                    <div>
                      {holding.profitLoss >= 0 ? "+" : ""}
                      {formatCurrency(holding.profitLoss)}
                    </div>
                    <div className="text-xs font-normal">
                      {holding.profitLossPercentage >= 0 ? "+" : ""}
                      {holding.profitLossPercentage.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{holding.purchaseDate}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setEditingHolding(holding)}
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingHolding(holding)}
                      className="text-wealth-danger hover:text-red-800 text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingHolding && (
        <EditHoldingModal
          holding={editingHolding}
          isOpen={!!editingHolding}
          onClose={() => setEditingHolding(null)}
        />
      )}

      {deletingHolding && (
        <DeleteHoldingDialog
          holding={deletingHolding}
          isOpen={!!deletingHolding}
          onClose={() => setDeletingHolding(null)}
        />
      )}
    </div>
  );
}
