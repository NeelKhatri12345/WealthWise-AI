interface UploadStats {
  totalUploads: number;
  processingCount: number;
  failedCount: number;
  avgUploadSize: string;
  status: 'normal' | 'busy' | 'overloaded';
}

interface UploadMonitorProps {
  stats: UploadStats;
}

export const UploadMonitor = ({ stats }: UploadMonitorProps) => {
  const statusStyles = {
    normal: 'bg-green-100 text-green-700',
    busy: 'bg-yellow-100 text-yellow-700',
    overloaded: 'bg-red-100 text-red-700',
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Queue</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[stats.status]}`}>
          {stats.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Total Uploads</p>
          <p className="text-lg font-bold text-gray-900">{stats.totalUploads.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Processing</p>
          <p className="text-lg font-bold text-yellow-600">{stats.processingCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Failed</p>
          <p className="text-lg font-bold text-red-600">{stats.failedCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Avg Size</p>
          <p className="text-lg font-bold text-gray-900">{stats.avgUploadSize}</p>
        </div>
      </div>
    </div>
  );
};
