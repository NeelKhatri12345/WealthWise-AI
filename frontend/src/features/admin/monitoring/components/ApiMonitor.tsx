interface ApiEndpoint {
  path: string;
  method: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'down';
}

interface ApiMonitorProps {
  endpoints: ApiEndpoint[];
}

const statusStyles = {
  healthy: 'bg-green-100 text-green-700',
  degraded: 'bg-yellow-100 text-yellow-700',
  down: 'bg-red-100 text-red-700',
};

export const ApiMonitor = ({ endpoints }: ApiMonitorProps) => {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">API Health</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {endpoints.map((ep) => (
              <tr key={`${ep.method}-${ep.path}`} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-medium text-gray-600">
                    {ep.method}
                  </span>
                  <span className="text-gray-900">{ep.path}</span>
                </td>
                <td className="px-6 py-3 text-gray-600">{ep.avgResponseTime}ms</td>
                <td className="px-6 py-3 text-gray-600">{ep.requestCount.toLocaleString()}</td>
                <td className="px-6 py-3 text-gray-600">{ep.errorRate}%</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[ep.status]}`}>
                    {ep.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
