import { useState } from 'react';
import { FileDropzone, UploadProgress, UploadHistory, StatementPreview } from './components';
import { useFileUpload } from './hooks';

export const UploadPage = () => {
  const { upload, progress, status, error, reset } = useFileUpload();
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setCurrentFile(files[0]);
      upload(files[0]);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Statement</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload your bank statement for AI-powered analysis
        </p>
      </div>

      <FileDropzone onFilesSelected={handleFilesSelected} />

      {currentFile && status !== 'idle' && (
        <UploadProgress
          fileName={currentFile.name}
          progress={progress}
          status={status === 'idle' ? 'uploading' : status}
          errorMessage={error ?? undefined}
          onCancel={reset}
        />
      )}

      {status === 'completed' && (
        <StatementPreview
          bankName="Sample Bank"
          transactions={[]}
          onConfirm={() => reset()}
          onReject={() => reset()}
        />
      )}

      <UploadHistory uploads={[]} />
    </div>
  );
};
