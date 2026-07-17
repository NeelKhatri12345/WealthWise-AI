/**
 * WealthWise AI — UploadPage
 *
 * Production-ready statement upload UI — Redux integrated.
 *
 * Features:
 *   • Drag-and-drop zone with active/hover states
 *   • Browse file button (hidden <input>)
 *   • Supported formats: PDF, PNG, JPG, JPEG (≤ 10 MB)
 *   • Client-side validation (type + size)
 *   • Selected file preview (name, size, type badge)
 *   • Remove file button
 *   • Upload button — disabled while uploading or until a valid file is chosen
 *   • Upload progress bar
 *   • Success state with uploaded document metadata
 *   • Error state with retry support
 *   • Validation Alert (friendly messages)
 *   • Professional empty-state illustration
 *
 * State management: Redux (uploadSlice)
 * API: uploadService → POST /statements/upload
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/utils/cn";
import TransactionsPage from "@/pages/transactions/TransactionsPage";

import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSelectedFile,
  clearUpload,
  clearError,
  uploadStatement,
  selectSelectedFile,
  selectUploadedDocument,
  selectUploadProgress,
  selectIsUploading,
  selectUploadSuccess,
  selectUploadError,
} from "@/store/slices/uploadSlice";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg", // covers both jpg and jpeg
] as const;

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_SIZE_LABEL = "10 MB";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "image/png": "PNG",
    "image/jpeg": "JPEG",
  };
  return map[mimeType] ?? mimeType.split("/")[1]?.toUpperCase() ?? "Unknown";
}

function getFileTypeBadgeVariant(
  mimeType: string,
): "danger" | "info" | "success" {
  if (mimeType === "application/pdf") return "danger";
  if (mimeType === "image/png") return "info";
  return "success"; // jpeg
}

function validateFile(file: File): string | null {
  const isValidType = (ACCEPTED_MIME_TYPES as readonly string[]).includes(
    file.type,
  );
  if (!isValidType) {
    return `"${file.name}" is not a supported format. Please upload a PDF, PNG, JPG, or JPEG file.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `"${file.name}" is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_SIZE_LABEL}.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Sub-components (UI only — no state)
// ---------------------------------------------------------------------------

/** Decorative illustration shown in the idle drop-zone */
function UploadIllustration() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Icon cluster */}
      <div className="relative flex items-center justify-center">
        {/* Shadow circle */}
        <div className="absolute h-24 w-24 rounded-full bg-primary-50 opacity-60" />
        {/* Main circle */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          {/* Cloud-upload icon */}
          <svg
            className="h-10 w-10 text-primary-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 16v-8m0 0-3 3m3-3 3 3" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
          </svg>
        </div>

        {/* Floating file-type badges */}
        <span className="absolute -right-2 -top-1 flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 shadow-sm">
          <svg
            className="h-4 w-4 text-red-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 12a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V18a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V12z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="absolute -bottom-1 -left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 shadow-sm">
          <svg
            className="h-4 w-4 text-blue-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {/* Copy */}
      <div className="text-center">
        <p className="text-base font-semibold text-gray-900">
          Drag & drop your statement here
        </p>
        <p className="mt-1 text-sm text-wealth-muted">
          or click <span className="font-medium text-primary-600">Browse</span>{" "}
          to choose a file
        </p>
      </div>
    </div>
  );
}

/** Info row for format + size constraints */
function UploadConstraints() {
  const formats = ["PDF", "PNG", "JPG", "JPEG"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-wealth-muted">Formats:</span>
        {formats.map((fmt) => (
          <Badge key={fmt} variant="default" size="sm">
            {fmt}
          </Badge>
        ))}
      </div>
      <span className="hidden h-3 w-px bg-wealth-border sm:block" aria-hidden="true" />
      <div className="flex items-center gap-1.5">
        <svg
          className="h-3.5 w-3.5 text-wealth-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs text-wealth-muted">
          Max size:{" "}
          <span className="font-medium text-gray-700">{MAX_SIZE_LABEL}</span>
        </span>
      </div>
    </div>
  );
}

/** Shows the selected file metadata with a remove button */
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const typeLabel = getFileTypeLabel(file.type);
  const badgeVariant = getFileTypeBadgeVariant(file.type);

  return (
    <div className="animate-scale-in flex items-center gap-4 rounded-xl border border-wealth-border bg-gray-50 px-4 py-3.5">
      {/* File-type icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50">
        <svg
          className="h-6 w-6 text-primary-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>

      {/* File metadata */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold text-gray-900"
          title={file.name}
        >
          {file.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant={badgeVariant} size="sm">
            {typeLabel}
          </Badge>
          <span className="text-xs text-wealth-muted">
            {formatBytes(file.size)}
          </span>
        </div>
      </div>

      {/* Remove button — hidden while uploading */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wealth-muted transition-colors hover:bg-red-50 hover:text-wealth-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Animated progress bar shown during upload */
interface ProgressBarProps {
  percent: number;
}

function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-wealth-muted">
        <span>Uploading…</span>
        <span className="font-medium text-gray-700">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/** Success banner shown after a successful upload */
interface SuccessBannerProps {
  fileName: string;
  onUploadAnother: () => void;
}

function SuccessBanner({ fileName, onUploadAnother }: SuccessBannerProps) {
  return (
    <div className="animate-fade-in-up space-y-4 rounded-xl border border-green-200 bg-green-50 p-5">
      <div className="flex items-start gap-3">
        {/* Checkmark icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-5 w-5 text-green-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">
            Statement uploaded successfully
          </p>
          <p className="mt-0.5 truncate text-xs text-green-700" title={fileName}>
            {fileName}
          </p>
          <p className="mt-1 text-xs text-green-600">
            Your statement is queued for processing. We&apos;ll extract your
            transactions shortly.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onUploadAnother}
        className="w-full"
      >
        Upload another statement
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UploadPage
// ---------------------------------------------------------------------------

export default function UploadPage() {
  useDocumentTitle("Upload Statements");

  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Redux state ────────────────────────────────────────────────────────────
  const selectedFile = useAppSelector(selectSelectedFile);
  const uploadedDocument = useAppSelector(selectUploadedDocument);
  const uploadProgress = useAppSelector(selectUploadProgress);
  const isUploading = useAppSelector(selectIsUploading);
  const uploadSuccess = useAppSelector(selectUploadSuccess);
  const uploadError = useAppSelector(selectUploadError);

  // ── Local UI state (not worth putting in Redux) ────────────────────────────
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Clear validation error when Redux error arrives
  useEffect(() => {
    if (uploadError) setValidationError(null);
  }, [uploadError]);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    (file: File) => {
      setValidationError(null);
      dispatch(clearError());
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }
      dispatch(setSelectedFile(file));
    },
    [dispatch],
  );

  const handleRemoveFile = useCallback(() => {
    dispatch(clearUpload());
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [dispatch]);

  const handleUploadAnother = useCallback(() => {
    dispatch(clearUpload());
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [dispatch]);

  // ── Input change ───────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // ── Drag-and-drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // ── Upload dispatch ────────────────────────────────────────────────────────

  const handleUpload = useCallback(() => {
    if (!selectedFile || isUploading) return;
    dispatch(uploadStatement(selectedFile));
  }, [dispatch, selectedFile, isUploading]);

  /** Retry: keep the same file, clear the error, dispatch again. */
  const handleRetry = useCallback(() => {
    if (!selectedFile) return;
    dispatch(clearError());
    dispatch(uploadStatement(selectedFile));
  }, [dispatch, selectedFile]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Upload Statements"
        description="Import your bank or credit card statements for AI-powered analysis. Supported formats: PDF, PNG, JPG, JPEG."
      />

      <div className="mx-auto max-w-2xl space-y-4">

        {/* ── Client-side Validation Alert ── */}
        {validationError && (
          <Alert
            variant="error"
            title="Invalid file"
            onClose={() => setValidationError(null)}
            className="animate-fade-in-up"
          >
            {validationError}
          </Alert>
        )}

        {/* ── Backend / Upload Error Alert ── */}
        {uploadError && (
          <Alert
            variant="error"
            title="Upload failed"
            onClose={() => dispatch(clearError())}
            className="animate-fade-in-up"
          >
            <span>{uploadError}</span>
            {selectedFile && (
              <button
                type="button"
                onClick={handleRetry}
                className="ml-2 font-medium underline hover:no-underline focus-visible:outline-none"
              >
                Try again
              </button>
            )}
          </Alert>
        )}

        {/* ── Success State ── */}
        {uploadSuccess && uploadedDocument ? (
          <SuccessBanner
            fileName={uploadedDocument.fileName}
            onUploadAnother={handleUploadAnother}
          />
        ) : (
          /* ── Upload Card ── */
          <Card padding="none" className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* Drop zone — hidden while uploading */}
                {!isUploading && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="File drop zone. Drag and drop a file or press Enter to browse."
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                      }
                    }}
                    className={cn(
                      "relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-6",
                      "rounded-xl border-2 border-dashed transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2",
                      isDragOver
                        ? "border-primary-400 bg-primary-50/70 scale-[1.01]"
                        : "border-wealth-border bg-gray-50/60 hover:border-primary-300 hover:bg-primary-50/30",
                    )}
                  >
                    <UploadIllustration />

                    {/* Browse button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      leftIcon={
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                      }
                    >
                      Browse Files
                    </Button>

                    {/* Drag-active overlay */}
                    {isDragOver && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-primary-50/80 backdrop-blur-sm">
                        <p className="text-base font-semibold text-primary-600">
                          Drop your file here
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Format + size constraints */}
                <UploadConstraints />

                {/* Hidden native file input */}
                <input
                  ref={inputRef}
                  id="file-input"
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(",")}
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={handleInputChange}
                  disabled={isUploading}
                />
              </div>
            </CardContent>

            {/* ── Selected File Preview + Upload Action ── */}
            {selectedFile && (
              <div className="border-t border-wealth-border bg-gray-50/40 px-6 py-5 sm:px-8 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-wealth-muted">
                  Selected File
                </p>

                <FilePreview
                  file={selectedFile}
                  onRemove={handleRemoveFile}
                  disabled={isUploading}
                />

                {/* Progress bar — shown while uploading */}
                {isUploading && <ProgressBar percent={uploadProgress} />}

                {/* Upload button row */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={!selectedFile || isUploading}
                    onClick={handleUpload}
                    leftIcon={
                      isUploading ? (
                        /* Spinner */
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                          <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                        </svg>
                      )
                    }
                  >
                    {isUploading ? "Uploading…" : "Upload Statement"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── How It Works Info Card ── */}
        <Card className="border-primary-100 bg-primary-50/40">
          <div className="flex items-start gap-4">
            {/* Info icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-5 w-5 text-primary-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">
                How it works
              </h2>
              <ol className="space-y-2 text-sm text-wealth-muted">
                {[
                  "Select or drag a PDF or image of your bank statement.",
                  "WealthWise AI parses your transactions automatically.",
                  "Review categorized expenses and AI-generated insights.",
                  "Track your financial health over time.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>

        {/* ── Privacy Note ── */}
        <Alert variant="info" className="text-xs">
          <span className="font-medium">Your data stays private.</span> Files
          are processed securely and never shared with third parties. Statements
          are deleted from our servers after analysis is complete.
        </Alert>
      </div>

      {/* ── Transactions Section ── */}
      <TransactionsPage hideHeader />
    </div>
  );
}
