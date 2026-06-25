interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  onCancel?: () => void;
}

export const UploadProgress = ({
  fileName,
  progress,
  status,
  errorMessage,
  onCancel,
}: UploadProgressProps) => {
  const statusConfig = {
    uploading: { label: 'Uploading...', color: 'bg-indigo-600' },
    processing: { label: 'Processing with OCR...', color: 'bg-yellow-500' },
    completed: { label: 'Completed', color: 'bg-green-500' },
    error: { label: 'Failed', color: 'bg-red-500' },
  };

  const config = statusConfig[status];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">{fileName}</p>
            <p className="text-xs text-gray-500">{config.label}</p>
          </div>
        </div>

        {status === 'uploading' && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${config.color} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
};
