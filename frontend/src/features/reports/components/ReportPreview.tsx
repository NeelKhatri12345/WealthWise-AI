interface ReportSection {
  title: string;
  content: string;
}

interface ReportPreviewProps {
  title: string;
  dateRange: string;
  sections: ReportSection[];
  onClose: () => void;
  onDownload?: () => void;
}

export const ReportPreview = ({ title, dateRange, sections, onClose, onDownload }: ReportPreviewProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{dateRange}</p>
          </div>
          <div className="flex items-center gap-3">
            {onDownload && (
              <button
                onClick={onDownload}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Download
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-base font-semibold text-gray-900 mb-2">{section.title}</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
