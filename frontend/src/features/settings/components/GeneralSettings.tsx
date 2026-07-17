interface GeneralSettingsProps {
  language: string;
  currency: string;
  dateFormat: string;
  onUpdate: (settings: {
    language: string;
    currency: string;
    dateFormat: string;
  }) => void;
}

export const GeneralSettings = ({
  language,
  currency,
  dateFormat,
  onUpdate,
}: GeneralSettingsProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">General</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            value={language}
            onChange={(e) =>
              onUpdate({ language: e.target.value, currency, dateFormat })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) =>
              onUpdate({ language, currency: e.target.value, dateFormat })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (&euro;)</option>
            <option value="GBP">GBP (&pound;)</option>
            <option value="INR">INR (&#8377;)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Format
          </label>
          <select
            value={dateFormat}
            onChange={(e) =>
              onUpdate({ language, currency, dateFormat: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );
};
