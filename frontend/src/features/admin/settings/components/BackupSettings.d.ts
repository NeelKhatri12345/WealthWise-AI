interface BackupInfo {
  lastBackup?: string;
  nextScheduled?: string;
  frequency: string;
  status: "success" | "in-progress" | "failed" | "none";
}
interface BackupSettingsProps {
  backup: BackupInfo;
  onBackupNow: () => void;
  onFrequencyChange: (frequency: string) => void;
  isBackingUp?: boolean;
}
export declare const BackupSettings: ({
  backup,
  onBackupNow,
  onFrequencyChange,
  isBackingUp,
}: BackupSettingsProps) => import("react").JSX.Element;
export {};
