type Theme = 'light' | 'dark' | 'system';

interface ThemeSettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themes: Array<{ value: Theme; label: string; description: string }> = [
  { value: 'light', label: 'Light', description: 'Classic light appearance' },
  { value: 'dark', label: 'Dark', description: 'Easier on the eyes in low light' },
  { value: 'system', label: 'System', description: 'Follows your OS preference' },
];

export const ThemeSettings = ({ currentTheme, onThemeChange }: ThemeSettingsProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Theme</h3>

      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.value}
            onClick={() => onThemeChange(theme.value)}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              currentTheme === theme.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-sm font-medium text-gray-900">{theme.label}</p>
            <p className="mt-1 text-xs text-gray-500">{theme.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
