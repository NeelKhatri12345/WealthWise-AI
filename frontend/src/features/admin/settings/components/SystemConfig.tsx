interface ConfigItem {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  description?: string;
}

interface SystemConfigProps {
  configs: ConfigItem[];
  onUpdate: (key: string, value: string) => void;
  onSave: () => void;
  isLoading?: boolean;
}

export const SystemConfig = ({ configs, onUpdate, onSave, isLoading = false }: SystemConfigProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">System Configuration</h3>

      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{config.label}</label>
            {config.description && (
              <p className="mb-1 text-xs text-gray-500">{config.description}</p>
            )}
            {config.type === 'select' ? (
              <select
                value={config.value}
                onChange={(e) => onUpdate(config.key, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {config.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={config.type}
                value={config.value}
                onChange={(e) => onUpdate(config.key, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={isLoading}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  );
};
