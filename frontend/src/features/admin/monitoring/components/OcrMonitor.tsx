interface OcrStats {
  totalProcessed: number;
  successRate: number;
  avgProcessingTime: number;
  queueSize: number;
  status: 'running' | 'idle' | 'error';
}

interface OcrMonitorProps {
  stats: OcrStats;
}

export const OcrMonitor = ({ stats }: OcrMonitorProps) => {
  const statusStyles = {
    running: 'bg-green-100 text-green-700',
    idle: 'bg-gray-100 text-gray-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">OCR Pipeline</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[stats.status]}`}>
          {stats.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Total Processed</p>
          <p className="text-lg font-bold text-gray-900">{stats.totalProcessed.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Success Rate</p>
          <p className="text-lg font-bold text-gray-900">{stats.successRate}%</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Avg Processing Time</p>
          <p className="text-lg font-bold text-gray-900">{stats.avgProcessingTime}s</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Queue Size</p>
          <p className="text-lg font-bold text-gray-900">{stats.queueSize}</p>
        </div>
      </div>
    </div>
  );
};
