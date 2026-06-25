import { ScoreDisplay, ScoreBreakdown, ScoreHistory, ScoreTips, MetricCard } from './components';
import { useHealthScore } from './hooks';

export const HealthScorePage = () => {
  const { data, isLoading, error } = useHealthScore();

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
        <p>{error ?? 'Failed to load health score'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Health Score</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track and improve your overall financial wellbeing
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <MetricCard label="Savings Rate" value="38.8%" trend={{ direction: 'up', value: '+2.1% this month' }} />
        <MetricCard label="Debt Ratio" value="22%" trend={{ direction: 'down', value: '-1.5% this month' }} />
        <MetricCard label="Emergency Fund" value="4.2 months" trend={{ direction: 'stable', value: 'No change' }} />
        <MetricCard label="Investment Return" value="8.5%" trend={{ direction: 'up', value: '+0.3% this quarter' }} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ScoreDisplay score={data.score} maxScore={data.maxScore} />
        <div className="lg:col-span-2">
          <ScoreBreakdown factors={data.factors} />
        </div>
      </div>

      <ScoreHistory data={data.history} />
      <ScoreTips tips={data.tips} />
    </div>
  );
};
