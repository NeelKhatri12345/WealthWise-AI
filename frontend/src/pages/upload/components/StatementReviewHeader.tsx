import React from "react";
import { Badge } from "@/components/ui/Badge";
import {
  uploadService,
  type StatementDetail,
  type StatementStatus,
  IN_PROGRESS_STATEMENT_STATUSES,
} from "@/services/api/upload.api";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectReviewHasUnsavedChanges, saveStatementTransactions, selectReviewTransactions, selectReviewIsSaving, restoreTransactions } from "@/store/slices/statementReviewSlice";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/routes";
import { parseApiError } from "@/utils/error";

interface StatementReviewHeaderProps {
  statement: StatementDetail;
  onStatusChange: (status: StatementStatus) => void;
}

export const StatementReviewHeader: React.FC<StatementReviewHeaderProps> = ({ statement, onStatusChange }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const hasUnsavedChanges = useAppSelector(selectReviewHasUnsavedChanges);
  const transactions = useAppSelector(selectReviewTransactions);
  const isSaving = useAppSelector(selectReviewIsSaving);
  
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    try {
      setError(null);
      await dispatch(saveStatementTransactions({ statementId: statement.id, transactions })).unwrap();
    } catch (err: unknown) {
      setError(parseApiError(err));
    }
  };

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      // If there are unsaved changes, we must save them first.
      if (hasUnsavedChanges) {
        await handleSave();
      }
      const updated = await uploadService.completeStatement(statement.id);
      onStatusChange(updated.status);
      navigate(ROUTES.UPLOAD);
    } catch (err: unknown) {
      setError(parseApiError(err));
      setIsProcessing(false);
    }
  };

  const handleReparse = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await uploadService.reparseStatement(statement.id);
      onStatusChange("processing");
      navigate(ROUTES.UPLOAD);
    } catch (err: unknown) {
      setError(parseApiError(err));
      setIsProcessing(false);
    }
  };

  const handleRestore = () => {
    if (window.confirm("Are you sure you want to discard all unsaved edits?")) {
      dispatch(restoreTransactions());
    }
  };

  // Mirrors the backend state machine (StatementProcessingService):
  // reparse is valid from ocr_completed/parsing/completed/failed, and
  // complete (accept) is only valid from parsing (parsing -> completed).
  const isPipelineRunning = IN_PROGRESS_STATEMENT_STATUSES.includes(statement.status);
  const canReparse = !isPipelineRunning;
  const canComplete = statement.status === "parsing";

  return (
    <div className="bg-white p-6 rounded-xl border border-wealth-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{statement.fileName}</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant={statement.status === "completed" ? "success" : statement.status === "failed" ? "danger" : isPipelineRunning ? "warning" : "default"}>
            {statement.status.toUpperCase()}
          </Badge>
          <span className="text-sm text-wealth-muted">
            Uploaded on {new Date(statement.createdAt).toLocaleDateString()}
          </span>
        </div>
        {error && <p className="text-sm text-wealth-danger mt-2">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        {hasUnsavedChanges && (
          <>
            <button
              onClick={handleRestore}
              className="text-sm font-medium text-wealth-muted hover:text-gray-900 transition-colors"
              disabled={isSaving || isProcessing}
            >
              Discard Edits
            </button>
            <button
              onClick={handleSave}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={isSaving || isProcessing}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
        
        <button
          onClick={handleReparse}
          disabled={isProcessing || !canReparse}
          className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors disabled:opacity-50"
        >
          Re-run Parser
        </button>

        <button
          onClick={handleAccept}
          disabled={isProcessing || !canComplete}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Accept Statement"}
        </button>
      </div>
    </div>
  );
};
