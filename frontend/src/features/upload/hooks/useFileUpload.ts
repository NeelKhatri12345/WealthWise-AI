import { useState, useCallback } from 'react';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface UseFileUploadReturn {
  upload: (file: File) => Promise<void>;
  progress: number;
  status: UploadStatus;
  error: string | null;
  reset: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Simulated upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }

      setStatus('processing');
      // TODO: Replace with actual API call using FormData
      await new Promise((resolve) => setTimeout(resolve, 1500));
      void file;

      setStatus('completed');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setError(null);
  }, []);

  return { upload, progress, status, error, reset };
};
