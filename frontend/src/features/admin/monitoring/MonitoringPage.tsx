import { ApiMonitor, SystemMonitor, OcrMonitor, UploadMonitor, ErrorLog } from './components';
import { useMonitoring } from './hooks';

export const MonitoringPage = () => {
  const { data, isLoading, error, refetch } = useMonitoring();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>{error ?? 'Failed to load monitoring data'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-1 text-sm text-gray-600">Real-time system health and performance</p>
        </div>
        <button
          onClick={refetch}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <SystemMonitor metrics={data.systemMetrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OcrMonitor stats={data.ocrStats} />
        <UploadMonitor stats={data.uploadStats} />
      </div>

      <ApiMonitor endpoints={data.apiEndpoints} />
      <ErrorLog errors={data.errors} />
    </div>
  );
};
