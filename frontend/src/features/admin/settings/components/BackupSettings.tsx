interface BackupInfo {
  lastBackup?: string;
  nextScheduled?: string;
  frequency: string;
  status: 'success' | 'in-progress' | 'failed' | 'none';
}

interface BackupSettingsProps {
  backup: BackupInfo;
  onBackupNow: () => void;
  onFrequencyChange: (frequency: string) => void;
  isBackingUp?: boolean;
}

const statusStyles = {
  success: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  none: 'bg-gray-100 text-gray-700',
};

export const BackupSettings = ({ backup, onBackupNow, onFrequencyChange, isBackingUp = false }: BackupSettingsProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Backup Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Last Backup</p>
            <p className="text-xs text-gray-500">{backup.lastBackup ?? 'Never'}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[backup.status]}`}>
            {backup.status}
          </span>
        </div>

        {backup.nextScheduled && (
          <p className="text-sm text-gray-600">
            Next scheduled: <span className="font-medium">{backup.nextScheduled}</span>
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
          <select
            value={backup.frequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <button
          onClick={onBackupNow}
          disabled={isBackingUp}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isBackingUp ? 'Backing up...' : 'Backup Now'}
        </button>
      </div>
    </div>
  );
};
