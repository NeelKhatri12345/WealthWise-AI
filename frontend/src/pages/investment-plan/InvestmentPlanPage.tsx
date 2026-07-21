/**
 * WealthWise AI — Investment Plan Page
 *
 * Premium, data-driven investment recommendation UI.
 * Determines prerequisite completion directly from backend APIs:
 *   - Financial Profile (financialProfileApi.getProfile)
 *   - Hybrid Health Score & Risk Profile (healthApi.getLatestSnapshot)
 */

import { useEffect, useCallback, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchLatestRecommendation,
  calculateRecommendation,
  selectInvestmentRecommendation,
} from "@/store/slices/investmentRecommendationSlice";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/routes/routes";
import { CHART_COLORS } from "@/charts/common/chartColors";
import { healthApi, type HealthScoreSnapshot } from "@/services/api/health.api";
import { financialProfileApi, type FinancialProfile } from "@/services/api/financialProfile.api";
import type { AllocationItem, ActionPlan } from "@/services/api/investmentRecommendation.api";
import { SuggestedInvestments } from "./SuggestedInvestments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(val: number): string {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function strategyColors(strategy: string) {
  switch (strategy) {
    case "aggressive":
      return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" };
    case "balanced":
      return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" };
    default:
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" };
  }
}

function readinessColors(readiness: string) {
  switch (readiness) {
    case "READY":
      return {
        dot: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Ready",
        description: "You have a strong financial foundation for investing.",
      };
    case "PARTIAL":
      return {
        dot: "bg-amber-400",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Partially Ready",
        description: "Your finances are stable, but improving emergency savings and reducing debt will strengthen your investment readiness.",
      };
    default:
      return {
        dot: "bg-red-500",
        badge: "bg-red-50 text-red-700 border-red-200",
        label: "Not Ready",
        description: "Focus on building financial stability before increasing investment exposure.",
      };
  }
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

// ─── Prerequisite Card Component ───────────────────────────────────────────────

function PrerequisiteStatusCard({
  hasProfile,
  hasHealthScore,
  healthScoreVal,
  healthBand,
  riskProfileVal,
  onGenerateHealthScore,
  generatingHealthScore,
  onGeneratePlan,
  generatingPlan,
  error,
}: {
  hasProfile: boolean;
  hasHealthScore: boolean;
  healthScoreVal: number | null;
  healthBand: string | null;
  riskProfileVal: string | null;
  onGenerateHealthScore: () => void;
  generatingHealthScore: boolean;
  onGeneratePlan: () => void;
  generatingPlan: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();
  const allReady = hasProfile && hasHealthScore;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="rounded-2xl border border-wealth-border bg-wealth-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Investment Plan Prerequisites</h2>
            <p className="text-sm text-gray-500">
              Complete the required steps below to generate your personalised investment strategy.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <span>{error}</span>
              {error.toLowerCase().includes("statement") && (
                <div className="mt-2">
                  <button
                    onClick={() => navigate(ROUTES.UPLOAD)}
                    className="text-xs font-semibold text-indigo-600 underline hover:text-indigo-800"
                  >
                    Upload Bank Statement →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Step 1: Financial Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/70 gap-3">
            <div className="flex items-center gap-3">
              {hasProfile ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm shrink-0">✓</span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm shrink-0">1</span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">Financial Profile Assessment</p>
                <p className="text-xs text-gray-500">
                  {hasProfile ? "Completed (100%)" : "Financial profile assessment incomplete"}
                </p>
              </div>
            </div>
            {!hasProfile && (
              <button
                onClick={() => navigate(ROUTES.FINANCIAL_PROFILE)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors self-start sm:self-auto"
              >
                Complete Profile
              </button>
            )}
          </div>

          {/* Step 2: Health Score & Risk Profile Assessment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/70 gap-3">
            <div className="flex items-center gap-3">
              {hasHealthScore ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm shrink-0">✓</span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm shrink-0">2</span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">Health Score & Risk Profile Assessment</p>
                <p className="text-xs text-gray-500">
                  {hasHealthScore
                    ? `Score: ${healthScoreVal}/100 (${healthBand}) · Risk Profile: ${riskProfileVal || "Determined"}`
                    : "Hybrid score & risk assessment not calculated yet"}
                </p>
              </div>
            </div>
            {!hasHealthScore && (
              <button
                onClick={onGenerateHealthScore}
                disabled={generatingHealthScore}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
              >
                {generatingHealthScore ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Generate Score & Risk"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Generate Plan CTA Button */}
        <div className="pt-2">
          <button
            onClick={onGeneratePlan}
            disabled={!allReady || generatingPlan}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              allReady
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-md shadow-indigo-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            }`}
          >
            {generatingPlan ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Investment Plan...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {allReady ? "Generate Investment Plan" : "Complete Prerequisites Above"}
              </>
            )}
          </button>
          {!allReady && (
            <p className="text-xs text-center text-gray-400 mt-2">
              All prerequisite checks must be completed before an investment plan can be generated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AllocationPieChart({ allocation }: { allocation: AllocationItem[] }) {
  const options: Highcharts.Options = {
    chart: { type: "pie", backgroundColor: "transparent", height: 300 },
    title: { text: undefined },
    tooltip: {
      pointFormat: "<b>{point.name}</b><br/>{point.percentage:.1f}% — ₹{point.custom.amount:,.0f}/mo",
      backgroundColor: "#1e293b",
      style: { color: "#f8fafc" },
      borderRadius: 8,
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: { enabled: false },
        showInLegend: false,
        innerSize: "60%",
        borderWidth: 0,
      },
    },
    series: [
      {
        type: "pie",
        data: allocation.map((item, i) => ({
          name: item.category,
          y: item.percentage,
          color: CHART_COLORS.categorical[i % CHART_COLORS.categorical.length],
          custom: { amount: item.monthly_amount },
        })),
      },
    ],
    credits: { enabled: false },
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:w-64 flex-shrink-0">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
      <div className="flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allocation.map((item, i) => (
            <div key={item.category} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS.categorical[i % CHART_COLORS.categorical.length] }}
              />
              <span className="text-gray-700 font-medium truncate">{item.category}</span>
              <span className="ml-auto text-gray-500 flex-shrink-0">
                {item.percentage % 1 === 0 ? item.percentage.toFixed(0) : item.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoadmapPhase({
  label,
  icon,
  tasks,
  accent,
  isLast,
}: {
  label: string;
  icon: string;
  tasks: string[];
  accent: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100" />
      )}
      <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accent}`}>
        {icon}
      </div>
      <div className="pb-6 flex-1">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">{label}</h4>
        <ul className="space-y-1.5">
          {tasks.map((task, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              {task}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InvestmentPlanPage() {
  useDocumentTitle("Investment Plan");
  const dispatch = useAppDispatch();
  const { snapshot, loading, calculating, error } = useAppSelector(selectInvestmentRecommendation);

  const [activeStrategy, setActiveStrategy] = useState<"conservative" | "balanced" | "aggressive">("conservative");

  // Prerequisite backend API state
  const [healthSnapshot, setHealthSnapshot] = useState<HealthScoreSnapshot | null>(null);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfile | null>(null);
  const [checkingPrereqs, setCheckingPrereqs] = useState<boolean>(true);
  const [generatingHealthScore, setGeneratingHealthScore] = useState<boolean>(false);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Load prerequisite state from current backend APIs on mount
  const checkPrerequisites = useCallback(async () => {
    setCheckingPrereqs(true);
    setPrereqError(null);
    try {
      const [hSnap, fProf] = await Promise.allSettled([
        healthApi.getLatestSnapshot(),
        financialProfileApi.getProfile(),
      ]);

      if (hSnap.status === "fulfilled") {
        setHealthSnapshot(hSnap.value);
      } else {
        setHealthSnapshot(null);
      }

      if (fProf.status === "fulfilled") {
        setFinancialProfile(fProf.value);
      } else {
        setFinancialProfile(null);
      }
    } catch {
      // Ignore initial prerequisite check errors — status flags handle missing state
    } finally {
      setCheckingPrereqs(false);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchLatestRecommendation());
    checkPrerequisites();
  }, [dispatch, checkPrerequisites]);

  useEffect(() => {
    if (snapshot) {
      setActiveStrategy(snapshot.recommended_strategy as "conservative" | "balanced" | "aggressive");
    }
  }, [snapshot]);

  const handleCalculate = useCallback(() => {
    setPrereqError(null);
    dispatch(calculateRecommendation());
  }, [dispatch]);

  const handleGenerateHealthScore = useCallback(async () => {
    setGeneratingHealthScore(true);
    setPrereqError(null);
    try {
      const newSnap = await healthApi.calculateScore();
      setHealthSnapshot(newSnap);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg =
        errorObj.response?.data?.detail ??
        errorObj.response?.data?.message ??
        "Failed to calculate Health Score & Risk Profile";
      setPrereqError(msg);
    } finally {
      setGeneratingHealthScore(false);
    }
  }, []);

  const hasProfile = financialProfile !== null && (financialProfile.profile_completion_percentage ?? 0) >= 100;
  const hasHealthScore = healthSnapshot !== null && healthSnapshot.score != null;

  // Loading skeleton
  if (loading || checkingPrereqs) {
    return (
      <div className="animate-pulse space-y-4 max-w-6xl mx-auto">
        <div className="h-10 bg-gray-100 rounded-xl w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  // Prerequisite view: if no snapshot exists or error occurred
  if (!snapshot) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Investment Plan</h1>
        <PrerequisiteStatusCard
          hasProfile={hasProfile}
          hasHealthScore={hasHealthScore}
          healthScoreVal={healthSnapshot ? healthSnapshot.score : null}
          healthBand={healthSnapshot ? healthSnapshot.band : null}
          riskProfileVal={healthSnapshot ? healthSnapshot.risk_profile : null}
          onGenerateHealthScore={handleGenerateHealthScore}
          generatingHealthScore={generatingHealthScore}
          onGeneratePlan={handleCalculate}
          generatingPlan={calculating}
          error={prereqError || error}
        />
      </div>
    );
  }

  const rc = readinessColors(snapshot.investment_readiness);
  const sc = strategyColors(snapshot.recommended_strategy);
  const allocation = snapshot.allocation_json ?? [];
  const reasoning = snapshot.reasoning_json;
  const warnings = snapshot.warnings_json ?? [];
  const actionPlan = snapshot.action_plan_json as ActionPlan | null;
  const allStrategies = snapshot.metadata_json?.all_strategies;
  const calcInputs = snapshot.metadata_json?.calculation_inputs;

  const strategyNames = ["conservative", "balanced", "aggressive"] as const;
  const strategyLabels: Record<string, string> = {
    conservative: "Conservative",
    balanced: "Balanced",
    aggressive: "Aggressive",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Plan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Category-level allocation · Generated{" "}
            {new Date(snapshot.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 self-start"
        >
          {calculating ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recalculate
            </>
          )}
        </button>
      </div>

      {/* ── Hero KPI Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Investment Readiness */}
        <div className={`rounded-2xl border p-5 ${rc.badge} border-current/20 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-2.5 w-2.5 rounded-full ${rc.dot} animate-pulse`} />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Investment Readiness</span>
            </div>
            <p className="text-2xl font-bold">{rc.label}</p>
            {snapshot.investment_readiness_score != null && (
              <p className="text-sm mt-0.5 opacity-80">Score: {snapshot.investment_readiness_score.toFixed(0)} / 100</p>
            )}
          </div>
          <p className="text-xs mt-3 opacity-90 leading-relaxed font-normal">
            {rc.description}
          </p>
        </div>

        {/* Recommended Strategy */}
        <div className={`rounded-2xl border p-5 ${sc.bg} ${sc.border}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Recommended Strategy</p>
          <p className={`text-2xl font-bold ${sc.text}`}>
            {strategyLabels[snapshot.recommended_strategy]}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-md bg-indigo-100/80 px-2 py-0.5 text-xs font-medium text-indigo-800">
              Rule-Based Recommendation
            </span>
            <span className="inline-flex items-center rounded-md bg-purple-100/80 px-2 py-0.5 text-xs font-medium text-purple-800">
              Category-Level Allocation
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-700">
              No Specific Investment Products
            </span>
          </div>
        </div>

      </div>

      {/* ── Allocation Pie Chart ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-wealth-border bg-wealth-card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Recommended Allocation — {strategyLabels[snapshot.recommended_strategy]} Strategy
        </h2>
        {allocation.length > 0 ? (
          <AllocationPieChart allocation={allocation} />
        ) : (
          <p className="text-sm text-gray-500">No allocation data available.</p>
        )}
      </div>

      {/* ── Allocation Cards ───────────────────────────────────────────────── */}
      {allocation.length > 0 && (
        <div className="rounded-2xl border border-wealth-border bg-wealth-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Allocation Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allocation.map((item, i) => (
              <div
                key={item.category}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-800">{item.category}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0 ${priorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: CHART_COLORS.categorical[i % CHART_COLORS.categorical.length] }}
                  >
                    {item.percentage % 1 === 0 ? item.percentage.toFixed(0) : item.percentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Suggested Investments (Phase 2) ────────────────────────────────── */}
      <SuggestedInvestments />

      {/* ── Professional Insight Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Why this Strategy */}
        <div className="rounded-2xl border border-wealth-border bg-wealth-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold shrink-0">
                💡
              </div>
              <h3 className="text-base font-semibold text-gray-900">Why this Strategy</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Based on your Health Score ({calcInputs?.health_score ? Math.round(calcInputs.health_score) : "—"}/100)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Based on your Risk Profile ({calcInputs?.risk_level ? calcInputs.risk_level.charAt(0) + calcInputs.risk_level.slice(1).toLowerCase() : "Moderate"})</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Based on available monthly investable amount ({formatINR(snapshot.monthly_investable_amount ?? 0)} / month)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Balances growth with safety</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: Investment Roadmap */}
        <div className="rounded-2xl border border-wealth-border bg-wealth-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold shrink-0">
                🗺️
              </div>
              <h3 className="text-base font-semibold text-gray-900">Investment Roadmap</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-indigo-700">Phase 1</span>
                <span className="text-gray-600">Build emergency fund</span>
              </div>
              <div className="text-center text-gray-400 font-bold text-xs py-0.5">↓</div>
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-indigo-700">Phase 2</span>
                <span className="text-gray-600">Start SIPs</span>
              </div>
              <div className="text-center text-gray-400 font-bold text-xs py-0.5">↓</div>
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-indigo-700">Phase 3</span>
                <span className="text-gray-600">Increase equity allocation</span>
              </div>
              <div className="text-center text-gray-400 font-bold text-xs py-0.5">↓</div>
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-indigo-700">Phase 4</span>
                <span className="text-gray-600">Annual portfolio review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Important Considerations */}
        <div className="rounded-2xl border border-wealth-border bg-wealth-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold shrink-0">
                ⚠️
              </div>
              <h3 className="text-base font-semibold text-gray-900">Important Considerations</h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Maintain emergency fund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Avoid high-interest debt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Increase SIP with salary growth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Review annually</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Diversify investments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── All Three Strategies ──────────────────────────────────────────── */}
      {allStrategies && (
        <div className="rounded-2xl border border-wealth-border bg-wealth-card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">All Strategies</h2>
          <p className="text-xs text-gray-400 mb-4">
            Compare all three strategies. Your recommendation is highlighted.
          </p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {strategyNames.map((s) => {
              const c = strategyColors(s);
              const isRec = s === snapshot.recommended_strategy;
              return (
                <button
                  key={s}
                  onClick={() => setActiveStrategy(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    activeStrategy === s
                      ? `${c.badge} ${c.border} shadow-sm`
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {strategyLabels[s]}
                  {isRec && (
                    <span className="ml-1.5 text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5">✓ Recommended</span>
                  )}
                </button>
              );
            })}
          </div>
          {allStrategies[activeStrategy] && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                {allStrategies[activeStrategy].description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allStrategies[activeStrategy].allocation.map((item, i) => (
                  <div key={item.category} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS.categorical[i % CHART_COLORS.categorical.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{item.category}</p>
                      {item.monthly_amount > 0 && (
                        <p className="text-xs text-gray-400">{formatINR(item.monthly_amount)}/mo</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {item.percentage % 1 === 0 ? item.percentage.toFixed(0) : item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Why This Plan ─────────────────────────────────────────────────── */}
      {reasoning && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-wealth-border bg-wealth-card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Why This Plan</h2>
            <p className="text-sm text-gray-600 mb-4">{reasoning.strategy_rationale}</p>
            {reasoning.positive_signals.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Positive Signals</p>
                <ul className="space-y-1.5">
                  {reasoning.positive_signals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reasoning.negative_signals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Areas to Improve</p>
                <ul className="space-y-1.5">
                  {reasoning.negative_signals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── How to Unlock a Better Strategy ─────────────────────────────── */}
          {reasoning.how_to_unlock.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <h2 className="text-base font-semibold text-indigo-900">How to Unlock a Better Strategy</h2>
              </div>
              <ul className="space-y-3">
                {reasoning.how_to_unlock.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-indigo-800">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Future Investment Roadmap ────────────────────────────────────── */}
      {actionPlan && (
        <div className="rounded-2xl border border-wealth-border bg-wealth-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">Future Investment Roadmap</h2>
          </div>
          <div className="space-y-0">
            <RoadmapPhase
              label="Now — Start Immediately"
              icon="⚡"
              tasks={actionPlan.now}
              accent="bg-indigo-100 text-indigo-700"
            />
            <RoadmapPhase
              label="3 Months — Build Momentum"
              icon="📈"
              tasks={actionPlan.three_months}
              accent="bg-purple-100 text-purple-700"
            />
            <RoadmapPhase
              label="6 Months — Consolidate"
              icon="🎯"
              tasks={actionPlan.six_months}
              accent="bg-amber-100 text-amber-700"
            />
            <RoadmapPhase
              label="1 Year — Review & Upgrade"
              icon="🏆"
              tasks={actionPlan.one_year}
              accent="bg-emerald-100 text-emerald-700"
              isLast
            />
          </div>
        </div>
      )}

      {/* ── Warnings ──────────────────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Important Notices</h2>
          <ul className="space-y-2">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-xs text-gray-400 leading-relaxed">
        <strong className="text-gray-500">Disclaimer:</strong> This Investment Plan is generated for educational
        purposes only. It provides category-level allocations and does not recommend specific stocks, mutual fund
        schemes, ETFs, or any specific financial products. Past performance of any asset class does not guarantee
        future returns. Please consult a SEBI-registered financial advisor or certified financial planner before
        making any investment decisions. WealthWise AI is not liable for any financial decisions made based on
        this plan.
      </div>
    </div>
  );
}

