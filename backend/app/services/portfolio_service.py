"""WealthWise AI - Portfolio Service"""

from uuid import UUID

from app.clients.gemini_client import GeminiClient
from app.core.logger import logger
from app.exceptions.custom_exceptions import NotFoundException
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.portfolio_schema import PortfolioRecommendationResponse


class PortfolioService:

    # Asset allocation templates per risk tier
    ALLOCATION_TEMPLATES = {
        "conservative": [
            {"asset_class": "Government Bonds", "allocation_pct": 50.0, "rationale": "Capital preservation", "example_instruments": ["G-Secs", "NSC"]},
            {"asset_class": "Fixed Deposits", "allocation_pct": 25.0, "rationale": "Guaranteed returns", "example_instruments": ["Bank FDs"]},
            {"asset_class": "Large Cap Equity", "allocation_pct": 15.0, "rationale": "Stable growth", "example_instruments": ["NIFTY 50 Index Fund"]},
            {"asset_class": "Gold", "allocation_pct": 10.0, "rationale": "Inflation hedge", "example_instruments": ["Gold ETF", "Sovereign Gold Bond"]},
        ],
        "moderate": [
            {"asset_class": "Large Cap Equity", "allocation_pct": 40.0, "rationale": "Core growth", "example_instruments": ["NIFTY 50 Index Fund"]},
            {"asset_class": "Government Bonds", "allocation_pct": 25.0, "rationale": "Stability anchor", "example_instruments": ["G-Secs"]},
            {"asset_class": "Mid Cap Equity", "allocation_pct": 20.0, "rationale": "Higher growth potential", "example_instruments": ["NIFTY Midcap 150"]},
            {"asset_class": "Gold", "allocation_pct": 10.0, "rationale": "Diversification", "example_instruments": ["Gold ETF"]},
            {"asset_class": "REITs", "allocation_pct": 5.0, "rationale": "Real estate exposure", "example_instruments": ["Embassy REIT"]},
        ],
        "aggressive": [
            {"asset_class": "Mid Cap Equity", "allocation_pct": 35.0, "rationale": "High growth", "example_instruments": ["NIFTY Midcap 150"]},
            {"asset_class": "Large Cap Equity", "allocation_pct": 25.0, "rationale": "Core holdings", "example_instruments": ["NIFTY 50"]},
            {"asset_class": "Small Cap Equity", "allocation_pct": 20.0, "rationale": "Maximum growth", "example_instruments": ["NIFTY Smallcap 250"]},
            {"asset_class": "International Equity", "allocation_pct": 10.0, "rationale": "Geographic diversification", "example_instruments": ["US Index Funds"]},
            {"asset_class": "Government Bonds", "allocation_pct": 10.0, "rationale": "Minimal safety buffer", "example_instruments": ["G-Secs"]},
        ],
        "very_aggressive": [
            {"asset_class": "Small Cap Equity", "allocation_pct": 40.0, "rationale": "Maximum return potential", "example_instruments": ["NIFTY Smallcap 250"]},
            {"asset_class": "Mid Cap Equity", "allocation_pct": 30.0, "rationale": "Growth momentum", "example_instruments": ["NIFTY Midcap 150"]},
            {"asset_class": "International Equity", "allocation_pct": 15.0, "rationale": "Global exposure", "example_instruments": ["US Tech ETF"]},
            {"asset_class": "Cryptocurrency / Alternatives", "allocation_pct": 10.0, "rationale": "High-risk high-reward", "example_instruments": ["Bitcoin ETF"]},
            {"asset_class": "Large Cap Equity", "allocation_pct": 5.0, "rationale": "Minimal stability", "example_instruments": ["NIFTY 50"]},
        ],
    }

    def __init__(
        self,
        analytics_repo: AnalyticsRepository,
        gemini_client: GeminiClient,
    ) -> None:
        self._repo = analytics_repo
        self._gemini = gemini_client

    async def get_recommendations(self, user_id: UUID) -> PortfolioRecommendationResponse:
        record = await self._repo.get_latest_portfolio(user_id)
        if not record:
            raise NotFoundException(
                "No portfolio found. Generate one via POST /portfolio/generate"
            )
        return PortfolioRecommendationResponse.model_validate(record)

    async def generate_recommendations(self, user_id: UUID) -> PortfolioRecommendationResponse:
        """
        Fetch latest risk profile → map to allocation → generate Gemini narrative.
        """
        risk_profile = await self._repo.get_latest_risk_profile(user_id)
        if not risk_profile:
            raise NotFoundException(
                "No risk profile available. Upload a bank statement first."
            )

        allocations = self.ALLOCATION_TEMPLATES.get(
            risk_profile.risk_level.value, self.ALLOCATION_TEMPLATES["moderate"]
        )

        # Generate Gemini narrative for the recommendation
        narrative = None
        try:
            prompt = (
                f"A user has a {risk_profile.risk_level.value} risk profile "
                f"with a risk score of {risk_profile.risk_score}. "
                f"Their recommended portfolio allocation is: {allocations}. "
                f"Write a concise, personalized 3-sentence explanation of this "
                f"recommendation in simple language. Be encouraging and educational."
            )
            text, _ = await self._gemini.generate(
                system_prompt="You are a portfolio advisor. Be concise.",
                history=[],
                user_message=prompt,
            )
            narrative = text
        except Exception as exc:
            logger.warning("Gemini narrative generation failed", exc_info=exc)

        record = await self._repo.save_portfolio({
            "user_id": user_id,
            "risk_profile_id": risk_profile.id,
            "recommendations": allocations,
            "rebalance_frequency": "quarterly",
            "narrative": narrative,
        })

        logger.info(
            "Portfolio generated",
            extra={"user_id": str(user_id), "risk_level": risk_profile.risk_level.value},
        )
        return PortfolioRecommendationResponse.model_validate(record)
