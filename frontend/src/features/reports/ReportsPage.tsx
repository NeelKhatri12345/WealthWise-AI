import { useState } from 'react';
import { ReportGenerator, ReportList, ReportFilters, DownloadButton } from './components';
import { useReports } from './hooks';

export const ReportsPage = () => {
  const { reports, isLoading, generateReport, downloadReport } = useReports();
  const [filters, setFilters] = useState({});

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">Generate and download financial reports</p>
        </div>
        <DownloadButton
          onDownloadPDF={() => downloadReport('latest', 'pdf')}
          onDownloadCSV={() => downloadReport('latest', 'csv')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <ReportGenerator onGenerate={generateReport} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <ReportFilters filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />
          <ReportList
            reports={reports}
            onView={(id) => console.log('View', id)}
            onDownload={(id) => downloadReport(id, 'pdf')}
          />
        </div>
      </div>
    </div>
  );
};
