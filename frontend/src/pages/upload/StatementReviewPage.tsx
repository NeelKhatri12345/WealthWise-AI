import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store";
import { fetchStatementTransactions, setStatementId, clearReviewState } from "@/store/slices/statementReviewSlice";
import { uploadService } from "@/services/api/upload.api";
import { StatementDetail } from "@/services/api/upload.api";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";
import { ROUTES } from "@/routes/routes";
import { StatementReviewHeader } from "./components/StatementReviewHeader";
import { ReviewTransactionTable } from "./components/ReviewTransactionTable";

import { parseApiError } from "@/utils/error";

export default function StatementReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [statement, setStatement] = React.useState<StatementDetail | null>(null);
  const [isLoadingStatement, setIsLoadingStatement] = React.useState(true);
  const [statementError, setStatementError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.UPLOAD);
      return;
    }

    dispatch(setStatementId(id));
    dispatch(fetchStatementTransactions(id));

    const loadStatement = async () => {
      try {
        setIsLoadingStatement(true);
        const st = await uploadService.getStatement(id);
        setStatement(st);
      } catch (err: unknown) {
        setStatementError(parseApiError(err));
      } finally {
        setIsLoadingStatement(false);
      }
    };

    loadStatement();

    return () => {
      dispatch(clearReviewState());
    };
  }, [id, dispatch, navigate]);

  if (isLoadingStatement) {
    return <LoadingScreen />;
  }

  if (statementError || !statement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-wealth-danger mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">{statementError || "Statement not found"}</h3>
        <button
          onClick={() => navigate(ROUTES.UPLOAD)}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StatementReviewHeader statement={statement} onStatusChange={(newStatus) => setStatement({ ...statement, status: newStatus })} />
      
      <div className="bg-white shadow-sm border border-wealth-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Parsed Transactions</h2>
        <ReviewTransactionTable statementId={statement.id} />
      </div>
    </div>
  );
}
