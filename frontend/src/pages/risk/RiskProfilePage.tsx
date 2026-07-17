import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchRiskProfile,
  selectRiskProfile,
} from "@/store/slices/riskProfileSlice";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ROUTES } from "@/routes/routes";

// ── Config ────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string; desc: string }
> = {
  low: {
    label: "Low Risk",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    icon: "🛡️",
    desc: "Your financial behaviour indicates conservative, low-risk patterns.",
  },
  moderate: {
    label: "Moderate Risk",
    color: "text-blue-700",
    bg: "bg-blue-50",
    icon: "⚖️",
    desc: "Your profile shows a balanced approach to financial risk.",
  },
  high: {
    label: "High Risk",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: "⚡",
    desc: "Your spending and saving patterns suggest higher financial risk exposure.",
  },
  very_high: {
    label: "Very High Risk",
    color: "text-red-700",
    bg: "bg-red-50",
    icon: "🔴",
    desc: "Your financial patterns indicate significant risk exposure. Consider reviewing spending habits.",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RiskProfilePage() {
  useDocumentTitle("Risk Profile");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile, loading, error } = useAppSelector(selectRiskProfile);

  useEffect(() => {
    dispatch(fetchRiskProfile());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-wealth-muted animate-pulse">
          Loading risk profile…
        </p>
      </div>
    );
  }

  const isNoProfileError =
    error &&
    (error.includes("No risk profile found") ||
      error.includes("Please upload"));

  if (isNoProfileError || (!loading && !error && !profile)) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Risk Profile"
          description="Understand your financial risk tolerance and exposure"
        />

        <Card className="flex flex-col items-center justify-center text-center p-12 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Risk Profile Yet
          </h3>
          <p className="text-sm text-wealth-muted mb-8 max-w-md">
            Your risk profile is automatically generated when you upload and
            accept a bank statement. The ML engine analyses your transaction
            patterns to determine your risk level.
          </p>

          <button
            onClick={() => navigate(ROUTES.UPLOAD)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Bank Statement
          </button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Risk Profile"
          description="Understand your financial risk tolerance and exposure"
        />
        <Card className="p-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-wealth-danger mb-4 font-medium">{error}</p>
          <button
            onClick={() => dispatch(fetchRiskProfile())}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  // ── Profile exists — render ───────────────────────────────────────────────
  const levelCfg = LEVEL_CONFIG[profile!.risk_level] ?? LEVEL_CONFIG.moderate;
  const calcDate = new Date(profile!.calculated_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const confidencePct =
    profile!.confidence != null
      ? `${(profile!.confidence * 100).toFixed(0)}%`
      : "N/A";

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Risk Profile"
        description="Understand your financial risk tolerance and exposure"
      />

      {/* Score banner */}
      <Card padding="none" className="overflow-hidden">
        <div
          className={`${levelCfg.bg} border-b border-wealth-border px-6 py-5 flex items-center justify-between`}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">{levelCfg.icon}</span>
            <div>
              <span
                className={`text-2xl font-extrabold tracking-tight ${levelCfg.color}`}
              >
                {levelCfg.label}
              </span>
              <p className="text-sm text-wealth-muted mt-0.5 max-w-md">
                {levelCfg.desc}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-wealth-muted">
              Calculated {calcDate}
            </span>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Score */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Risk Score
              </span>
              <span
                className={`text-3xl font-extrabold ${levelCfg.color}`}
              >
                {Number(profile!.risk_score).toFixed(0)}
              </span>
              <span className="text-sm text-wealth-muted"> / 100</span>
            </div>

            {/* Confidence */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Model Confidence
              </span>
              <span className="text-3xl font-extrabold text-violet-700">
                {confidencePct}
              </span>
            </div>

            {/* Level */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Risk Level
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${levelCfg.color} ${levelCfg.bg}`}
              >
                {levelCfg.label}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>Low Risk</span>
              <span>Very High Risk</span>
            </div>
            <div className="w-full bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100 h-3 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 h-full w-1 bg-gray-800 rounded-full transition-all duration-700"
                style={{
                  left: `${Math.min(Number(profile!.risk_score), 100)}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xs text-wealth-muted leading-relaxed">
            Your risk profile is derived from ML analysis of your bank
            statement transactions. Factors include spending patterns, income
            stability, savings behaviour, and debt ratios. This profile
            contributes 15% to your Final Hybrid Health Score.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
