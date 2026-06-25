import { useState, useEffect } from 'react';

interface AdminSettingsData {
  maintenanceMode: boolean;
  scheduledMaintenance?: string;
  configs: Array<{
    key: string;
    label: string;
    value: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
    description?: string;
  }>;
  backup: {
    lastBackup?: string;
    nextScheduled?: string;
    frequency: string;
    status: 'success' | 'in-progress' | 'failed' | 'none';
  };
}

interface UseAdminSettingsReturn {
  data: AdminSettingsData | null;
  isLoading: boolean;
  error: string | null;
  toggleMaintenance: (enabled: boolean) => Promise<void>;
  updateConfig: (key: string, value: string) => void;
  saveConfigs: () => Promise<void>;
  triggerBackup: () => Promise<void>;
  updateBackupFrequency: (frequency: string) => Promise<void>;
}

export const useAdminSettings = (): UseAdminSettingsReturn => {
  const [data, setData] = useState<AdminSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({
        maintenanceMode: false,
        configs: [
          { key: 'max_upload_size', label: 'Max Upload Size (MB)', value: '10', type: 'number', description: 'Maximum file size for uploads' },
          { key: 'ocr_provider', label: 'OCR Provider', value: 'azure', type: 'select', options: ['azure', 'google', 'tesseract'], description: 'OCR service provider' },
          { key: 'ai_model', label: 'AI Model', value: 'gemini-pro', type: 'select', options: ['gemini-pro', 'gpt-4', 'claude-3'], description: 'AI model for financial coaching' },
        ],
        backup: {
          lastBackup: '2024-01-15 03:00 AM',
          nextScheduled: '2024-01-16 03:00 AM',
          frequency: 'daily',
          status: 'success',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaintenance = async (enabled: boolean) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setData((prev) => (prev ? { ...prev, maintenanceMode: enabled } : prev));
  };

  const updateConfig = (key: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        configs: prev.configs.map((c) => (c.key === key ? { ...c, value } : c)),
      };
    });
  };

  const saveConfigs = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const triggerBackup = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const updateBackupFrequency = async (frequency: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setData((prev) => (prev ? { ...prev, backup: { ...prev.backup, frequency } } : prev));
  };

  useEffect(() => { fetchData(); }, []);

  return { data, isLoading, error, toggleMaintenance, updateConfig, saveConfigs, triggerBackup, updateBackupFrequency };
};
