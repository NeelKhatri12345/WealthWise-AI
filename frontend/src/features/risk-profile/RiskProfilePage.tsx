import {
  RiskGauge,
  RiskFactors,
  RiskAssessment,
  RiskComparison,
  RiskHistory,
} from "./components";
import { useRiskProfile } from "./hooks";

const assessmentQuestions = [
  {
    id: "income_stability",
    text: "How stable is your monthly income?",
    options: [
      { value: "very_stable", label: "Very stable - fixed salary" },
      { value: "stable", label: "Mostly stable with some variation" },
      { value: "variable", label: "Variable - freelance/commission based" },
      { value: "unstable", label: "Highly unpredictable" },
    ],
  },
  {
    id: "emergency_fund",
    text: "How many months of expenses do you have saved?",
    options: [
      { value: "6_plus", label: "6+ months" },
      { value: "3_to_6", label: "3-6 months" },
      { value: "1_to_3", label: "1-3 months" },
      { value: "less_1", label: "Less than 1 month" },
    ],
  },
  {
    id: "debt_comfort",
    text: "How comfortable are you with your current debt level?",
    options: [
      { value: "no_debt", label: "No debt at all" },
      { value: "comfortable", label: "Comfortable - manageable payments" },
      { value: "concerned", label: "Somewhat concerned" },
      { value: "stressed", label: "Very stressed about debt" },
    ],
  },
];

export const RiskProfilePage = () => {
  const { data, isLoading, error, submitAssessment } = useRiskProfile();

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
        <p>{error ?? "Failed to load risk profile"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Risk Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Understand and manage your financial risk exposure
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RiskGauge level={data.level} score={data.score} />
        <div className="lg:col-span-2">
          <RiskFactors factors={data.factors} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskComparison benchmarks={data.benchmarks} />
        <RiskAssessment
          questions={assessmentQuestions}
          onSubmit={submitAssessment}
        />
      </div>

      <RiskHistory data={data.history} />
    </div>
  );
};
