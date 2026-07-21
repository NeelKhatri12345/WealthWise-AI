import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/routes/routes";

export function ContextSummaryCard() {
  const navigate = useNavigate();
  const { snapshot, profile } = useAppSelector((state) => state.financialProfile);
  const dashboardSummary = useAppSelector((state) => state.dashboard.summary.data);

  const healthScore = snapshot?.score ?? null;
  const healthBand = snapshot?.band ?? "N/A";
  const riskProfile = snapshot?.risk_profile ?? profile?.risk_comfort ?? "N/A";
  const savingsRate = dashboardSummary?.savingsRate ?? snapshot?.calculation_metadata?.savings_rate ?? null;
  
  const hasEmergency = profile?.has_emergency_fund ?? false;
  const emergencyMonths = profile?.emergency_fund_months ?? 0;
  const emergencyFundStr = hasEmergency
    ? `${Number(emergencyMonths).toFixed(1)} months`
    : "None";

  const topGoal = profile?.financial_goals && profile.financial_goals.length > 0
    ? profile.financial_goals[0]
    : "None";

  const getBandBadgeVariant = (band: string) => {
    switch (band) {
      case "EXCELLENT":
      case "GOOD":
        return "success";
      case "FAIR":
        return "warning";
      default:
        return "danger";
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    const r = risk.toUpperCase();
    if (r === "CONSERVATIVE") return "info";
    if (r === "MODERATE") return "warning";
    return "danger";
  };

  return (
    <Card padding="md" className="bg-wealth-card border border-wealth-border shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Financial Profile Context</h3>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Health Score Card */}
        <div
          onClick={() => navigate(ROUTES.HEALTH_SCORE)}
          className="group cursor-pointer rounded-lg bg-gray-50 p-3 transition-all hover:bg-primary-50 border border-gray-100 hover:border-primary-200"
        >
          <p className="text-[10px] font-medium text-wealth-muted uppercase tracking-wider group-hover:text-primary-600">Health Score</p>
          <p className="mt-1 text-lg font-bold text-gray-900 group-hover:text-primary-700">
            {healthScore !== null ? `${healthScore}/100` : "N/A"}
          </p>
          {healthScore !== null && (
            <div className="mt-1">
              <Badge variant={getBandBadgeVariant(healthBand)} size="sm">
                {healthBand}
              </Badge>
            </div>
          )}
        </div>

        {/* Risk Profile Card */}
        <div
          onClick={() => navigate(ROUTES.HEALTH_SCORE)}
          className="group cursor-pointer rounded-lg bg-gray-50 p-3 transition-all hover:bg-primary-50 border border-gray-100 hover:border-primary-200"
        >
          <p className="text-[10px] font-medium text-wealth-muted uppercase tracking-wider group-hover:text-primary-600">Risk Profile</p>
          <p className="mt-1 text-lg font-bold text-gray-900 group-hover:text-primary-700 capitalize">
            {riskProfile ? riskProfile.toLowerCase() : "N/A"}
          </p>
          {riskProfile && riskProfile !== "N/A" && (
            <div className="mt-1">
              <Badge variant={getRiskBadgeVariant(riskProfile)} size="sm">
                {riskProfile}
              </Badge>
            </div>
          )}
        </div>

        {/* Savings Rate Card */}
        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
          <p className="text-[10px] font-medium text-wealth-muted uppercase tracking-wider">Savings Rate</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {savingsRate !== null ? `${Number(savingsRate).toFixed(1)}%` : "N/A"}
          </p>
          <p className="mt-1 text-[10px] text-wealth-muted">
            {savingsRate !== null && Number(savingsRate) >= 20 ? "Target Met (20%+)" : "Needs Attention"}
          </p>
        </div>

        {/* Emergency Fund Card */}
        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
          <p className="text-[10px] font-medium text-wealth-muted uppercase tracking-wider">Emergency Fund</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{emergencyFundStr}</p>
          <p className="mt-1 text-[10px] text-wealth-muted">
            {hasEmergency && emergencyMonths >= 3 ? "Protected ✓" : "At Risk ⚠️"}
          </p>
        </div>

        {/* Top Financial Goal Card */}
        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100 min-w-0">
          <p className="text-[10px] font-medium text-wealth-muted uppercase tracking-wider truncate">Top Goal</p>
          <p className="mt-1 text-base font-bold text-gray-900 truncate capitalize">
            {topGoal.replace("_", " ")}
          </p>
          <p className="mt-1.5 text-[10px] text-wealth-muted truncate">Active Goal</p>
        </div>
      </div>
    </Card>
  );
}
