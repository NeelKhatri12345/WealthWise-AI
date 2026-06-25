type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';

interface RiskProfileWidgetProps {
  riskLevel: RiskLevel;
  riskScore: number;
  onClick?: () => void;
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low Risk', color: 'text-green-700', bgColor: 'bg-green-100' },
  moderate: { label: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { label: 'High Risk', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  'very-high': { label: 'Very High', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const RiskProfileWidget = ({ riskLevel, riskScore, onClick }: RiskProfileWidgetProps) => {
  const config = riskConfig[riskLevel];

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
    >
      <h3 className="text-sm font-medium text-gray-500 mb-2">Risk Profile</h3>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${config.color} ${config.bgColor}`}>
          {config.label}
        </span>
        <span className="text-2xl font-bold text-gray-900">{riskScore}</span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Based on your financial analysis
      </p>
    </button>
  );
};
