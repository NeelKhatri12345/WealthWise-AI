import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchHealthScore, selectHealthScore } from "@/store/slices/healthScoreSlice";
import {
  fetchLatestSnapshot,
  calculateHealthScore,
  selectFinancialProfile,
} from "@/store/slices/financialProfileSlice";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import type { HealthScoreSnapshot } from "@/services/api/health.api";

// ── Hybrid snapshot components ────────────────────────────────────────────────

const BAND_CONFIG: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  EXCELLENT: { label: "Excellent", color: "text-emerald-700", bg: "bg-emerald-50", bar: "bg-emerald-500" },
  GOOD:      { label: "Good",      color: "text-blue-700",    bg: "bg-blue-50",    bar: "bg-blue-500" },
  FAIR:      { label: "Fair",      color: "text-amber-700",   bg: "bg-amber-50",   bar: "bg-amber-500" },
  WEAK:      { label: "Weak",      color: "text-orange-700",  bg: "bg-orange-50",  bar: "bg-orange-500" },
  CRITICAL:  { label: "Critical",  color: "text-red-700",     bg: "bg-red-50",     bar: "bg-red-500" },
};

const RISK_CONFIG: Record<string, { label: string; badge: string }> = {
  CONSERVATIVE: { label: "Conservative", badge: "bg-sky-100 text-sky-700 border-sky-200" },
  MODERATE:     { label: "Moderate",     badge: "bg-violet-100 text-violet-700 border-violet-200" },
  AGGRESSIVE:   { label: "Aggressive",   badge: "bg-rose-100 text-rose-700 border-rose-200" },
};

function HybridComponentBar({
  label,
  score,
  maxScore,
  barClass,
}: {
  label: string;
  score: number;
  maxScore: number;
  barClass: string;
}) {
  const pct = Math.min((score / maxScore) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {score.toFixed(1)} <span className="text-wealth-muted font-normal">/ {maxScore}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HybridSnapshotCard({
  snapshot,
  onRecalculate,
  recalculating,
}: {
  snapshot: HealthScoreSnapshot;
  onRecalculate: () => void;
  recalculating: boolean;
}) {
  const band = BAND_CONFIG[snapshot.band] ?? BAND_CONFIG.FAIR;
  const risk = snapshot.risk_profile ? (RISK_CONFIG[snapshot.risk_profile] ?? null) : null;

  const components = [
    { label: "Savings & Cash Flow", score: snapshot.component_scores.cash_flow_score, max: 25 },
    { label: "Spending Discipline", score: snapshot.component_scores.spending_score, max: 20 },
    { label: "Debt Burden",         score: snapshot.component_scores.debt_burden_score, max: 20 },
    { label: "Emergency Prep.",     score: snapshot.component_scores.emergency_score, max: 15 },
    { label: "Income Stability",    score: snapshot.component_scores.income_stability_score, max: 10 },
    { label: "Investment Readiness",score: snapshot.component_scores.investment_readiness_score, max: 10 },
  ];

  const calcDate = new Date(snapshot.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const bankStatementScore = snapshot.calculation_metadata?.bank_statement_score ?? 0;
  const financialProfileScore = snapshot.calculation_metadata?.financial_profile_score ?? 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card padding="none" className="overflow-hidden">
        <div className={`${band.bg} border-b border-wealth-border px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-widest text-wealth-muted">Final Hybrid Health Score</span>
              <span className={`text-4xl font-extrabold tracking-tight ${band.color}`}>
                {Number(snapshot.score).toFixed(1)}
                <span className="text-base font-semibold text-wealth-muted ml-1">/ 100</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 ml-4">
              <span className={`text-lg font-bold ${band.color}`}>{band.label}</span>
              {risk && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${risk.badge}`}>
                  {risk.label} Risk
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className="text-[10px] text-wealth-muted">Calculated {calcDate}</span>
            <button
              id="recalculate-score-btn"
              onClick={onRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-wealth-border text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {recalculating ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Recalculate
            </button>
          </div>
        </div>

        {/* Component breakdown */}
        <CardContent className="p-6 space-y-6">
          <p className="text-xs text-wealth-muted leading-relaxed">
            Calculated using 60% bank statement analysis and 40% financial profile responses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Bank Statement Analysis</span>
                <span>{Number(bankStatementScore).toFixed(0)}/100 (Weight: 60%)</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${bankStatementScore}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Financial Profile</span>
                <span>{Number(financialProfileScore).toFixed(0)}/100 (Weight: 40%)</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full" style={{ width: `${financialProfileScore}%` }} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-4">Detailed Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {components.map((c) => (
                <HybridComponentBar
                  key={c.label}
                  label={c.label}
                  score={c.score}
                  maxScore={c.max}
                  barClass={band.bar}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factors & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positive factors */}
        <Card padding="none" className="overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold text-emerald-800">What's Working</span>
          </div>
          <CardContent className="p-5">
            {snapshot.positive_factors.length > 0 ? (
              <ul className="space-y-3">
                {snapshot.positive_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-wealth-muted">Complete your financial profile to see strengths.</p>
            )}
          </CardContent>
        </Card>

        {/* Negative factors */}
        <Card padding="none" className="overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-5 py-3.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-bold text-red-700">Areas to Improve</span>
          </div>
          <CardContent className="p-5">
            {snapshot.negative_factors.length > 0 ? (
              <ul className="space-y-3">
                {snapshot.negative_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-wealth-muted">No major concerns identified.</p>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card padding="none" className="overflow-hidden">
          <div className="bg-violet-50 border-b border-violet-100 px-5 py-3.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-bold text-violet-800">Tailored Suggestions</span>
          </div>
          <CardContent className="p-5">
            {snapshot.suggestions.length > 0 ? (
              <ul className="space-y-3">
                {snapshot.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-[10px]">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-wealth-muted">Excellent financial health — maintain your current practices!</p>
            )}
          </CardContent>
        </Card>
      </div>


    </div>
  );
}


interface BreakdownBarProps {
  label: string;
  score: number;
  maxScore: number;
}

const BreakdownBar = ({ label, score, maxScore }: BreakdownBarProps) => {
  const percentage = (score / maxScore) * 100;
  
  let barColorClass = "bg-primary-600";
  if (percentage >= 80) {
    barColorClass = "bg-emerald-500";
  } else if (percentage >= 60) {
    barColorClass = "bg-blue-500";
  } else if (percentage >= 40) {
    barColorClass = "bg-amber-500";
  } else {
    barColorClass = "bg-red-500";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {score} <span className="text-wealth-muted font-normal">/ {maxScore}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function HealthScorePage() {
  useDocumentTitle("Financial Health Score");

  const dispatch = useAppDispatch();
  const { scoreData, loading, error } = useAppSelector(selectHealthScore);
  const { snapshot, snapshotLoading } = useAppSelector(selectFinancialProfile);

  useEffect(() => {
    dispatch(fetchHealthScore());
    dispatch(fetchLatestSnapshot());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchHealthScore());
  };

  const handleRecalculate = () => {
    dispatch(calculateHealthScore());
  };

  const getGradeVariant = (grade: string): "success" | "info" | "warning" | "danger" | "default" => {
    const g = grade.toUpperCase();
    if (g.startsWith("A")) return "success";
    if (g.startsWith("B") || g.startsWith("C")) return "info";
    if (g.startsWith("D")) return "warning";
    if (g.startsWith("F")) return "danger";
    return "default";
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-wealth-muted animate-pulse">Calculating your health score...</p>
      </div>
    );
  }

  const isNoStatementError = error && (
    error.includes("Please upload a bank statement first") ||
    error.includes("upload a bank statement")
  );

  if (isNoStatementError || (!loading && !error && !scoreData)) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Financial Health Score"
          description="Your comprehensive financial wellness assessment"
        />
        
        <Card className="flex flex-col items-center justify-center text-center p-12 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Health Score Calculated</h3>
          <p className="text-sm text-wealth-muted mb-8 max-w-md">
            Before we can assess your financial health, you need to upload a bank statement. We will parse your transactions and compile a breakdown of your score automatically.
          </p>
          
          <a
            href="/upload"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
          >
            Upload Bank Statement
          </a>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Financial Health Score"
          description="Your comprehensive financial wellness assessment"
        />
        
        <Card className="p-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-wealth-danger mb-4 font-medium">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Retry Assessment
          </button>
        </Card>
      </div>
    );
  }

  // ── Case: no hybrid snapshot yet ───────────────────────────────────────────
  if (!snapshot) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Financial Health Score"
          description="Your comprehensive financial wellness assessment"
        />

        <Card className="flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <div className="w-full space-y-4 mb-6">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-600">Financial Profile</span>
              <Badge variant="warning">Not Completed</Badge>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-600">Final Health Score</span>
              <span className="text-sm font-bold text-amber-600">Pending</span>
            </div>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-8 max-w-md leading-relaxed">
            Complete your Financial Profile to unlock your final Health Score.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/financial-profile"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Complete Financial Profile
            </a>
            {scoreData && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 border border-wealth-border text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Refresh
              </button>
            )}
          </div>
        </Card>

        {/* Small secondary card — bank-only score if available */}
        {scoreData && (
          <LegacyScoreCard
            scoreData={scoreData}
            getGradeVariant={getGradeVariant}
          />
        )}
      </div>
    );
  }

  // ── Case: hybrid snapshot exists — primary display ──────────────────────────
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Financial Health Score"
        description="Your comprehensive financial wellness assessment"
      />

      {/* PRIMARY — Final Hybrid Health Score */}
      <HybridSnapshotCard
        snapshot={snapshot}
        onRecalculate={handleRecalculate}
        recalculating={snapshotLoading}
      />

      {/* SECONDARY — Bank Statement Score (collapsed / small) */}
      {scoreData && (
        <LegacyScoreCard
          scoreData={scoreData}
          getGradeVariant={getGradeVariant}
        />
      )}
    </div>
  );
}

// ── Secondary card: bank-statement-only score ─────────────────────────────────

function LegacyScoreCard({
  scoreData,
  getGradeVariant,
}: {
  scoreData: {
    score: number;
    grade: string;
    status: string;
    breakdown: {
      savings_rate: number;
      expense_ratio: number;
      cash_flow: number;
      spending_behaviour: number;
      income_stability: number;
      transaction_diversity: number;
      financial_discipline: number;
    };
    strengths: string[];
    recommendations: string[];
    notes: string[];
  };
  getGradeVariant: (g: string) => "success" | "info" | "warning" | "danger" | "default";
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-wealth-border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Collapsed header */}
      <button
        id="legacy-score-toggle"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-wealth-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">
            Bank Statement Score: {Number(scoreData.score).toFixed(0)}/100
          </span>
          <span className="text-xs text-wealth-muted font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            Used as 60% of final score
          </span>
          <Badge variant={getGradeVariant(scoreData.grade)} size="sm">
            Grade {scoreData.grade}
          </Badge>
        </div>
        <svg
          className={`w-4 h-4 text-wealth-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-wealth-border p-5 space-y-5">
          <p className="text-xs text-wealth-muted">
            Calculated from bank statement transactions only (savings rate, cash flow, spending, discipline).
            This is a partial score — the Final Hybrid Score above is more accurate.
          </p>

          {scoreData.notes && scoreData.notes.length > 0 && (
            <div className="space-y-2">
              {scoreData.notes.map((note, idx) => (
                <Alert key={idx} variant="warning" title="Notice">
                  {note}
                </Alert>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <BreakdownBar label="Savings Rate" score={scoreData.breakdown.savings_rate} maxScore={25} />
            <BreakdownBar label="Expense Ratio" score={scoreData.breakdown.expense_ratio} maxScore={20} />
            <BreakdownBar label="Cash Flow" score={scoreData.breakdown.cash_flow} maxScore={15} />
            <BreakdownBar label="Spending Behaviour" score={scoreData.breakdown.spending_behaviour} maxScore={15} />
            <BreakdownBar label="Income Stability" score={scoreData.breakdown.income_stability} maxScore={10} />
            <BreakdownBar label="Transaction Diversity" score={scoreData.breakdown.transaction_diversity} maxScore={5} />
            <BreakdownBar label="Financial Discipline" score={scoreData.breakdown.financial_discipline} maxScore={10} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoreData.strengths && scoreData.strengths.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-2">Strengths</p>
                <ul className="space-y-1.5">
                  {scoreData.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {scoreData.recommendations && scoreData.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-700 mb-2">Suggestions</p>
                <ul className="space-y-1.5">
                  {scoreData.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">→</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
