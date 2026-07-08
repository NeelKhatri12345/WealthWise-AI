import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchPortfolioHoldings } from "@/store/slices/portfolioHoldingSlice";
import { PortfolioHoldingsTable } from "./components/PortfolioHoldingsTable";
import { AddHoldingModal } from "./components/AddHoldingModal";

export default function PortfolioHoldingsPage() {
  useDocumentTitle("Portfolio Holdings");
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.portfolioHoldings);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPortfolioHoldings());
  }, [dispatch]);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <PageHeader
        title="Portfolio Holdings"
        description="Manually track your investment holdings"
        actions={<Button onClick={() => setIsAddOpen(true)}>Add Holding</Button>}
      />

      {error && (
        <div className="bg-red-50 text-wealth-danger p-4 rounded-md mb-4 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white p-4 rounded-lg border border-wealth-border shadow-sm flex flex-col">
        <PortfolioHoldingsTable />
      </div>

      <AddHoldingModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
