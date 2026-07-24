/**
 * WealthWise AI — Suggested Investments Exploration Module (Phase 4 Redesign)
 *
 * Provides a professional, premium exploration dashboard matching Groww, INDmoney, and Kuvera.
 * Consumes the deterministic scoring engine data with zero backend modifications.
 *
 * Features:
 *   - Sticky filters & sorting toolbar
 *   - Redesigned product cards with stars, metrics grid, and confidence badges
 *   - Mathematical reconstruction of backend confidence score weights (User, Market, Diversification, Rating)
 *   - Interactive Product Details modal with tabbed exploration panels
 *   - Multi-product selection and comparative analysis overlay
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { investmentRecommendationApi } from "@/services/api/investmentRecommendation.api";
import type {
  ProductSuggestionsResponse,
  CategorySuggestions,
  ProductRecommendation,
} from "@/services/api/investmentRecommendation.api";

// ─── Helper Functions ───

function getRiskBadge(risk: string) {
  switch (risk.toUpperCase()) {
    case "LOW":
      return {
        cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-500",
        label: "Low Risk",
      };
    case "HIGH":
      return {
        cls: "bg-rose-50 text-rose-700 border border-rose-200",
        dot: "bg-rose-500",
        label: "High Risk",
      };
    default:
      return {
        cls: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-500",
        label: "Medium Risk",
      };
  }
}

function getRatingStars(rating: number | null): string {
  if (rating === null) return "★★★★☆";
  const floor = Math.floor(rating);
  const remainder = rating - floor;
  const stars = "★".repeat(floor) + (remainder >= 0.5 ? "½" : "") + "☆".repeat(5 - Math.ceil(rating));
  return stars;
}

function formatCurrency(val: number | null): string {
  if (val === null) return "—";
  return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ─── Mathematical Confidence Reconstructer ───

interface ConfidenceFactors {
  userMatch: number;
  marketQuality: number;
  diversification: number;
  productRating: number;
}

function reconstructConfidence(product: ProductRecommendation): ConfidenceFactors {
  const finalScore = product.confidence_pct / 100;
  
  // 1. Diversification benefit (matches backend map)
  let divBenefit = 0.8;
  const type = product.product_type.toUpperCase();
  if (["MF_INDEX", "MF_EQUITY", "MF_DEBT", "ETF", "LIQUID_FUND", "OVERNIGHT_FUND"].includes(type)) {
    divBenefit = 1.0;
  } else if (["GOLD_ETF", "GOLD_MF", "SGB"].includes(type)) {
    divBenefit = 0.8;
  } else if (type === "STOCK") {
    divBenefit = 0.5;
  }

  // 2. Rating score
  const rawRating = product.market_data?.rating ?? null;
  const ratingScore = rawRating !== null ? rawRating / 5.0 : 0.6;

  // 3. User suitability (M1 score)
  let m1Score = 0.6;
  if (product.market_scores) {
    const marketVal = product.market_scores.overall_score;
    // final_score = m1_score * 0.50 + marketVal * 0.25 + divBenefit * 0.15 + ratingScore * 0.10
    m1Score = (finalScore - marketVal * 0.25 - divBenefit * 0.15 - ratingScore * 0.10) / 0.50;
  } else {
    // final_score = m1_score * 0.80 + divBenefit * 0.10 + ratingScore * 0.10
    m1Score = (finalScore - divBenefit * 0.10 - ratingScore * 0.10) / 0.80;
  }

  // Bounds capping
  const clamp = (v: number) => Math.min(1.0, Math.max(0.0, v));

  return {
    userMatch: clamp(m1Score),
    marketQuality: clamp(product.market_scores?.overall_score ?? 0.5),
    diversification: clamp(divBenefit),
    productRating: clamp(ratingScore),
  };
}

// ─── Progress Indicator Subcomponent ───

function MetricProgress({ label, val }: { label: string; val: number }) {
  const pct = Math.min(100, Math.max(0, val * 100));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500";
  const textClass = pct >= 80 ? "text-emerald-700" : pct >= 60 ? "text-amber-700" : "text-rose-700";

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px] font-medium text-gray-500">
        <span>{label}</span>
        <span className={`font-bold ${textClass}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Tabs Component ───

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { id: string; label: string }[];
}

function Tabs({ activeTab, setActiveTab, tabs }: TabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all ${
            activeTab === tab.id
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Detailed Drawer Modal ───

interface DetailsModalProps {
  product: ProductRecommendation | null;
  onClose: () => void;
}

function DetailsModal({ product, onClose }: DetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  if (!product) return null;

  const factors = reconstructConfidence(product);

  const keyMetrics = [
    { label: "Asset Class", value: product.asset_class },
    { label: "Product Type", value: product.product_type.replace("_", " ") },
    { label: "Risk Category", value: product.risk_level },
    { label: "Investment Style", value: product.investment_style },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        {/* Header section */}
        <div className="bg-gradient-to-r from-indigo-50 to-slate-50 p-6 relative border-b border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            ✕
          </button>
          <div className="pr-8">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              {product.fund_house || "Exploration Asset"}
            </span>
            <h3 className="text-lg font-bold text-slate-800 leading-snug mt-1">{product.name}</h3>
            {product.symbol && (
              <span className="inline-block mt-2 text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Ticker: {product.symbol}
              </span>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex-shrink-0 px-6 bg-white border-b border-gray-100">
          <Tabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "scores", label: "Market Scoring" },
              { id: "reasons", label: "Suitability & Why Recommended" },
            ]}
          />
        </div>

        {/* Scrollable Content area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {keyMetrics.map((m, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Summary Stats Grid */}
              <div className="border border-slate-100 rounded-2xl p-4 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Exploration Parameters</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400">Rating</span>
                    <div className="text-amber-500 font-bold mt-0.5">{getRatingStars(product.market_data?.rating ?? null)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400">Expense Ratio</span>
                    <div className="text-slate-800 font-semibold mt-0.5">
                      {product.market_data?.expense_ratio != null ? `${product.market_data.expense_ratio.toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400">Asset Size (AUM)</span>
                    <div className="text-slate-800 font-semibold mt-0.5">
                      {product.market_data?.aum_cr != null ? `₹${product.market_data.aum_cr.toLocaleString("en-IN")} Cr` : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scores" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-indigo-900">Overall Strength Index</h4>
                  <p className="text-[10px] text-indigo-500 mt-0.5">Normalized score generated from 7 key signals</p>
                </div>
                <div className="h-12 w-12 rounded-full border-2 border-indigo-500 flex items-center justify-center bg-white">
                  <span className="text-sm font-black text-indigo-600">
                    {product.market_scores ? `${(product.market_scores.overall_score * 100).toFixed(0)}%` : "—"}
                  </span>
                </div>
              </div>

              {product.market_scores ? (
                <div className="grid grid-cols-2 gap-4">
                  <MetricProgress label="Valuation Score" val={product.market_scores.valuation_score} />
                  <MetricProgress label="Growth Score" val={product.market_scores.growth_score} />
                  <MetricProgress label="Stability Score" val={product.market_scores.volatility_score} />
                  <MetricProgress label="Liquidity Score" val={product.market_scores.liquidity_score} />
                  <MetricProgress label="Quality Score" val={product.market_scores.quality_score} />
                  <MetricProgress label="Cost Efficiency" val={product.market_scores.cost_efficiency_score} />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No score breakdown available for this asset.</p>
              )}
            </div>
          )}

          {activeTab === "reasons" && (
            <div className="space-y-4">
              {/* Match reasons checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Why Recommended</h4>
                <div className="space-y-2">
                  {product.match_reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence breakdown visualizers */}
              <div className="space-y-3.5 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Confidence Vector Analysis</h4>
                <div className="space-y-3">
                  <MetricProgress label="User Fit Weight (50%)" val={factors.userMatch} />
                  <MetricProgress label="Market Quality Factor (25%)" val={factors.marketQuality} />
                  <MetricProgress label="Asset Diversification (15%)" val={factors.diversification} />
                  <MetricProgress label="Product Performance Rating (10%)" val={factors.productRating} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-Product Comparison Modal ───

interface CompareModalProps {
  products: ProductRecommendation[];
  onClose: () => void;
}

function CompareModal({ products, onClose }: CompareModalProps) {
  if (products.length === 0) return null;

  // Determine winners/highlights dynamically
  // 1. Highest expected return
  const highestReturn = Math.max(...products.map(p => p.market_data?.expected_return_1y ?? 0));
  // 2. Lowest expense ratio
  const lowestExpense = Math.min(...products.map(p => p.market_data?.expense_ratio ?? 100));
  // 3. Highest overall score
  const highestScore = Math.max(...products.map(p => p.market_scores?.overall_score ?? 0));
  // 4. Highest confidence score
  const highestConfidence = Math.max(...products.map(p => p.confidence_pct));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="bg-indigo-900 text-white p-6 relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-indigo-200 hover:text-white p-1">✕</button>
          <h3 className="text-base font-bold">Comparative Investment Analysis</h3>
          <p className="text-xs text-indigo-200 mt-0.5">Highlighting relative advantages side-by-side</p>
        </div>

        <div className="overflow-auto flex-1 p-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 font-semibold text-slate-500 w-1/4">Metric</th>
                {products.map((p) => (
                  <th key={p.id} className="py-3 px-4 font-bold text-slate-800 w-1/4">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 font-medium text-slate-500">Asset Type</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-800">
                    {p.product_type.replace("_", " ")}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">Expected Return (1Y)</td>
                {products.map((p) => {
                  const val = p.market_data?.expected_return_1y ?? null;
                  const isBest = val !== null && val === highestReturn;
                  return (
                    <td key={p.id} className={`py-3 px-4 ${isBest ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-800"}`}>
                      {val !== null ? `${val}%` : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">Expense Ratio</td>
                {products.map((p) => {
                  const val = p.market_data?.expense_ratio ?? null;
                  const isBest = val !== null && val === lowestExpense;
                  return (
                    <td key={p.id} className={`py-3 px-4 ${isBest ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-800"}`}>
                      {val !== null ? `${val}%` : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">AUM (Asset Size)</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-800">
                    {p.market_data?.aum_cr ? `₹${p.market_data.aum_cr.toLocaleString("en-IN")} Cr` : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">Overall Strength</td>
                {products.map((p) => {
                  const val = p.market_scores?.overall_score ?? null;
                  const isBest = val !== null && val === highestScore;
                  return (
                    <td key={p.id} className={`py-3 px-4 ${isBest ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-800"}`}>
                      {val !== null ? `${(val * 100).toFixed(0)}%` : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">Confidence Score</td>
                {products.map((p) => {
                  const isBest = p.confidence_pct === highestConfidence;
                  return (
                    <td key={p.id} className={`py-3 px-4 ${isBest ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-800"}`}>
                      {p.confidence_pct}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">Risk Profile</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-800">
                    {p.risk_level}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card Redesign Component ───

interface CardProps {
  product: ProductRecommendation;
  onViewDetails: () => void;
  onToggleCompare: () => void;
  isCompared: boolean;
}

function ProductCard({ product, onViewDetails, onToggleCompare, isCompared }: CardProps) {
  const risk = getRiskBadge(product.risk_level);
  const scoreClass = "text-primary-800 bg-primary-50 border-primary-200";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 p-5 flex flex-col justify-between h-full gap-4 relative">
      {/* Header section */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {product.fund_house || "Asset Recommended"}
            </span>
            <h4 className="text-sm font-bold text-slate-800 leading-snug mt-0.5 line-clamp-2">
              {product.name}
            </h4>
          </div>
          <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium flex-shrink-0 flex items-center gap-1 ${risk.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
            {risk.label}
          </span>
        </div>

        {/* Rating stars & product type pills */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-amber-500 font-bold leading-none">
            {getRatingStars(product.market_data?.rating ?? null)}
          </span>
          <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
            {product.product_type.replace("_", " ")}
          </span>
          <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            {product.investment_style}
          </span>
        </div>

        {/* Key comparison stats */}
        {(() => {
          const isStockType = product.product_type === "STOCK";
          const isMFType = product.product_type.startsWith("MF_") || product.product_type === "GOLD_MF" || product.product_type === "LIQUID_FUND" || product.product_type === "OVERNIGHT_FUND";
          const isETFType = product.product_type === "ETF" || product.product_type === "GOLD_ETF";

          const expectedCAGR = product.market_data?.expected_return_3y ?? product.market_data?.expected_return_1y;
          const hasCAGR = expectedCAGR != null;

          let metric2Label = "Expense Ratio";
          let metric2Value = "N/A";

          if (isStockType) {
            metric2Label = "Dividend Yield";
            metric2Value = product.market_data?.dividend_yield != null ? `${product.market_data.dividend_yield}%` : "—";
          } else if (isMFType || isETFType) {
            metric2Value = product.market_data?.expense_ratio != null ? `${product.market_data.expense_ratio}%` : "—";
          }

          return (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-50">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Expected CAGR</span>
                <span className="text-xs font-extrabold text-slate-800">
                  {hasCAGR ? `${expectedCAGR}%` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">{metric2Label}</span>
                <span className="text-xs font-bold text-slate-700">
                  {metric2Value}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Match Quality Banner */}
      <div>
        <div className={`rounded-xl border p-2.5 flex items-center justify-between ${scoreClass}`}>
          <div>
            <span className="text-[9px] uppercase tracking-wider block font-semibold text-primary-700">Match Confidence</span>
            <span className="text-xs font-extrabold text-primary-900">{product.confidence_pct}% Match Rate</span>
          </div>
          {product.market_scores && (
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider block font-semibold text-primary-700">Strength Score</span>
              <span className="text-xs font-extrabold text-primary-900">{(product.market_scores.overall_score * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Dynamic reason tags */}
        {product.reason_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {product.reason_tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="bg-slate-50 text-slate-600 text-[10px] font-medium rounded px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action tray */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 flex-shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer select-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={isCompared}
              onChange={onToggleCompare}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Compare
          </label>
          <button
            onClick={onViewDetails}
            className="flex-1 text-center font-bold text-indigo-600 hover:text-indigo-800 text-xs bg-indigo-50/50 hover:bg-indigo-50 rounded-xl py-1.5 transition-colors"
          >
            Explore Parameters
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Explorer Component ───

export function SuggestedInvestments() {
  const [data, setData] = useState<ProductSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal selection
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);

  // Compared products lists
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Filters & Sorters State
  const [filterAssetType, setFilterAssetType] = useState("ALL");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [filterHorizon, setFilterHorizon] = useState("ALL");
  const [allProviders, setAllProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState("CONFIDENCE");

  const handleClearFilters = useCallback(() => {
    setFilterAssetType("ALL");
    setFilterRisk("ALL");
    setFilterHorizon("ALL");
    setSelectedProvider("ALL");
    setSelectedCompany("ALL");
    setSortBy("CONFIDENCE");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await investmentRecommendationApi.getProductSuggestions();
      setData(result);
      setAllProviders(result.providers || []);
      setAllCompanies((result as { companies?: unknown[] }).companies || []);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Unable to load product recommendations.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Process category product filtering and sorting
  const processCategory = useCallback(
    (cat: CategorySuggestions): CategorySuggestions => {
      let filtered = [...cat.products];

      // 1. Asset Type filtering
      if (filterAssetType !== "ALL") {
        filtered = filtered.filter((p) => {
          const type = p.product_type.toUpperCase();
          if (filterAssetType === "STOCKS") return type === "STOCK";
          if (filterAssetType === "ETFS") return ["ETF", "GOLD_ETF"].includes(type);
          if (filterAssetType === "MF") return ["MF_INDEX", "MF_EQUITY", "MF_DEBT", "GOLD_MF"].includes(type);
          if (filterAssetType === "FIXED") return ["FD", "SGB", "LIQUID_FUND", "OVERNIGHT_FUND"].includes(type);
          return true;
        });
      }

      // 2. Risk filtering
      if (filterRisk !== "ALL") {
        filtered = filtered.filter((p) => p.risk_level.toUpperCase() === filterRisk);
      }

      // 3. Horizon filtering
      if (filterHorizon !== "ALL") {
        filtered = filtered.filter((p) => {
          // we match against the product's defined suitable horizons list
          return p.id.includes("short") || p.product_type === "LIQUID_FUND" || p.product_type === "OVERNIGHT_FUND"
            ? filterHorizon === "SHORT"
            : filterHorizon === "LONG";
        });
      }

      // 4. Fund House filtering
      if (selectedProvider !== "ALL") {
        filtered = filtered.filter((p) => p.fund_house === selectedProvider);
      }

      // 4b. Company filtering for stocks
      if (selectedCompany !== "ALL") {
        filtered = filtered.filter((p) => p.name === selectedCompany);
      }

      // 5. Sorting
      filtered.sort((a, b) => {
        if (sortBy === "CONFIDENCE") return b.confidence_pct - a.confidence_pct;
        if (sortBy === "SCORE") {
          const valA = a.market_scores?.overall_score ?? 0;
          const valB = b.market_scores?.overall_score ?? 0;
          return valB - valA;
        }
        if (sortBy === "RISK") {
          const riskMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
          return riskMap[a.risk_level.toUpperCase()] - riskMap[b.risk_level.toUpperCase()];
        }
        if (sortBy === "RETURN") {
          const valA = a.market_data?.expected_return_3y ?? a.market_data?.expected_return_1y ?? 0;
          const valB = b.market_data?.expected_return_3y ?? b.market_data?.expected_return_1y ?? 0;
          return valB - valA;
        }
        if (sortBy === "EXPENSE") {
          const valA = a.market_data?.expense_ratio ?? 100;
          const valB = b.market_data?.expense_ratio ?? 100;
          return valA - valB;
        }
        return 0;
      });

      return {
        ...cat,
        products: filtered,
      };
    },
    [filterAssetType, filterRisk, filterHorizon, selectedProvider, selectedCompany, sortBy]
  );

  const processedCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.map(processCategory).filter((c) => c.products.length > 0);
  }, [data, processCategory]);

  const processedSupplementary = useMemo(() => {
    if (!data) return [];
    return (data.supplementary_categories || []).map(processCategory).filter((c) => c.products.length > 0);
  }, [data, processCategory]);

  // Gather flat list of all compared items
  const comparedProducts = useMemo(() => {
    if (!data) return [];
    const flatList: ProductRecommendation[] = [];
    const scan = (cats: CategorySuggestions[]) => {
      cats.forEach((cat) => {
        cat.products.forEach((p) => {
          if (comparedIds.includes(p.id)) flatList.push(p);
        });
      });
    };
    scan(data.categories);
    scan(data.supplementary_categories || []);
    return flatList;
  }, [data, comparedIds]);

  const toggleCompare = (id: string) => {
    setComparedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        alert("You can compare a maximum of 3 products at a time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading investment suggestions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={load} className="mt-3 text-xs font-bold text-red-800 underline underline-offset-2">
          Retry Explorer Load
        </button>
      </div>
    );
  }

  if (!data || data.categories.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Search & sticky Filters controls panel */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border border-slate-100 rounded-3xl shadow-sm p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Asset type filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Asset Type</label>
          <select
            value={filterAssetType}
            onChange={(e) => setFilterAssetType(e.target.value)}
            className="rounded-xl border-slate-200 text-xs font-semibold focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1.5"
          >
            <option value="ALL">All Categories</option>
            <option value="STOCKS">Equity Stocks</option>
            <option value="ETFS">ETFs</option>
            <option value="MF">Mutual Funds</option>
            <option value="FIXED">Fixed / Debt</option>
          </select>
        </div>

        {/* Risk profile filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Risk Class</label>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="rounded-xl border-slate-200 text-xs font-semibold focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1.5"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>

        {/* Horizon filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Horizon</label>
          <select
            value={filterHorizon}
            onChange={(e) => setFilterHorizon(e.target.value)}
            className="rounded-xl border-slate-200 text-xs font-semibold focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1.5"
          >
            <option value="ALL">All Horizons</option>
            <option value="SHORT">Short Term</option>
            <option value="MEDIUM">Medium Term</option>
            <option value="LONG">Long Term</option>
          </select>
        </div>

        {/* Fund house filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Fund House</label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="rounded-xl border-slate-200 text-xs font-semibold focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1.5"
          >
            <option value="ALL">All Providers</option>
            {allProviders.map((fh) => (
              <option key={fh} value={fh}>
                {fh}
              </option>
            ))}
          </select>
        </div>

        {/* Company filter (for stocks) */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Company</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            disabled={filterAssetType !== "ALL" && filterAssetType !== "STOCKS"}
            className="rounded-xl border-slate-200 text-xs font-semibold focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="ALL">All Companies</option>
            {allCompanies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sorters selection */}
        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sort Results</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border-slate-200 text-xs font-semibold focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1.5"
          >
            <option value="CONFIDENCE">Highest Fit confidence</option>
            <option value="SCORE">Overall Market Score</option>
            <option value="RISK">Lowest Risk Badges</option>
            <option value="RETURN">Highest Performance Yield</option>
            <option value="EXPENSE">Lowest Expense Ratios</option>
          </select>
        </div>
      </div>

      {/* Investment Readiness Gate Warning Banner */}
      {data.investment_readiness === "NOT_READY" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex gap-4 shadow-sm items-start animate-fade-in">
          <div className="text-2xl mt-0.5">⚠️</div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950">Investment Readiness is LOW</h4>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              Your current financial situation indicates high debt burden, low savings rate, or insufficient emergency savings. 
              Active equity assets (such as Direct Stocks, ETFs, and active Equity Mutual Funds) are currently gated and not suggested. 
              Please review and complete the prioritized <strong>Now</strong> and <strong>3 Months</strong> Action Items on your main Investment Plan page to improve your financial readiness.
            </p>
          </div>
        </div>
      )}

      {processedCategories.length === 0 && processedSupplementary.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="text-3xl">🔍</span>
            <h4 className="text-sm font-bold text-slate-800">No products found matching filters</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Try adjusting your Asset Type, Risk Class, Horizon, Fund House, or Company filters to locate compatible assets.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Render Core Categories accordion groups */}
          <div className="space-y-4">
            {processedCategories.map((cat) => (
              <div key={cat.category} className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>🎯</span>
                    {cat.category}
                  </h3>
                  {cat.monthly_allocation != null && cat.monthly_allocation > 0 && (
                    <span className="text-xs text-indigo-600 font-bold">
                      Allocation: {formatCurrency(cat.monthly_allocation)}/mo ({cat.allocation_pct?.toFixed(0)}%)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cat.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={() => setSelectedProduct(product)}
                      onToggleCompare={() => toggleCompare(product.id)}
                      isCompared={comparedIds.includes(product.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Render Supplementary Categories groups */}
          {processedSupplementary.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="border-l-4 border-indigo-500 pl-3">
                <h3 className="text-sm font-bold text-slate-800">Additional Exploration Assets</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Supplementary options suited to balanced/aggressive strategies</p>
              </div>
              <div className="space-y-6">
                {processedSupplementary.map((cat) => (
                  <div key={cat.category} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">{cat.category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cat.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onViewDetails={() => setSelectedProduct(product)}
                          onToggleCompare={() => toggleCompare(product.id)}
                          isCompared={comparedIds.includes(product.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Compare Floating Drawer Tray */}
      {comparedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-3xl shadow-xl px-5 py-3.5 flex items-center justify-between gap-5 border border-slate-800 animate-bounce-short">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold">{comparedIds.length} assets marked</span>
            <div className="flex -space-x-2">
              {comparedProducts.map((p, i) => (
                <div key={i} className="h-6 w-6 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black uppercase text-indigo-100">
                  {p.name.substring(0, 2)}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareModalOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors"
            >
              Analyze Compare
            </button>
            <button
              onClick={() => setComparedIds([])}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Explore Dialog Drawer Modal overlay */}
      {selectedProduct && (
        <DetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Compare modal analysis dialog */}
      {compareModalOpen && (
        <CompareModal products={comparedProducts} onClose={() => setCompareModalOpen(false)} />
      )}
    </div>
  );
}
