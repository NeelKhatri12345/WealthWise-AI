"""WealthWise AI - Analytics Service

Computes Financial Health Score and Risk Profile from transactions.
Loads pre-trained ML models from app.state (loaded at startup in main.py).
"""

from typing import Sequence
from uuid import UUID

from fastapi import Request

from app.core.logger import logger
from app.exceptions.custom_exceptions import NotFoundException
from app.models.transaction import Transaction
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.health_score_schema import HealthScoreDetailResponse
from app.schemas.risk_profile_schema import RiskProfileResponse
from app.services.financial_metrics_service import FinancialMetricsService
from app.services.health_score_service import HealthScoreService


class AnalyticsService:

    def __init__(
        self,
        analytics_repo: AnalyticsRepository,
        metrics_service: FinancialMetricsService,
        health_score_service: HealthScoreService,
    ) -> None:
        self._repo = analytics_repo
        self._metrics_service = metrics_service
        self._health_score_service = health_score_service

    async def get_latest_health_score(self, user_id: UUID) -> HealthScoreDetailResponse:
        """Calculate and return the latest health score on demand."""
        metrics = await self._metrics_service.get_metrics(user_id)
        if metrics.transaction_count == 0:
            raise NotFoundException(
                "No health score found. Please upload a bank statement first."
            )
        return self._health_score_service.calculate_health_score(metrics)

    async def get_health_score_history(
        self, user_id: UUID, limit: int = 10
    ) -> list[HealthScoreDetailResponse]:
        """Return history of health scores (calculated on demand)."""
        metrics = await self._metrics_service.get_metrics(user_id)
        if metrics.transaction_count == 0:
            return []
        score = self._health_score_service.calculate_health_score(metrics)
        return [score]

    async def get_health_score_by_statement(
        self, user_id: UUID, statement_id: UUID
    ) -> HealthScoreDetailResponse:
        """Calculate and return the health score for a specific statement on demand."""
        metrics = await self._metrics_service.get_metrics(user_id, statement_id)
        if metrics.transaction_count == 0:
            raise NotFoundException("Health score not found for this statement")
        return self._health_score_service.calculate_health_score(metrics)

    async def get_latest_risk_profile(self, user_id: UUID) -> RiskProfileResponse:
        record = await self._repo.get_latest_risk_profile(user_id)
        if not record:
            raise NotFoundException(
                "No risk profile found. Please upload a bank statement first."
            )
        return RiskProfileResponse.model_validate(record)

    async def get_risk_profile_history(
        self, user_id: UUID, limit: int = 10
    ) -> list[RiskProfileResponse]:
        records = await self._repo.get_risk_profile_history(user_id, limit)
        return [RiskProfileResponse.model_validate(r) for r in records]

    async def compute_and_save_health_score(
        self,
        user_id: UUID,
        statement_id: UUID,
        transactions: Sequence[Transaction],
        request: Request | None = None,
    ) -> HealthScoreDetailResponse:
        """
        Computes financial health score from transaction list.
        Phase 2 architectural changes: Do not persist to database during this phase.
        """
        metrics = self._metrics_service.compute_metrics_from_transactions(transactions)
        score_detail = self._health_score_service.calculate_health_score(metrics)

        logger.info(
            "Health score computed on demand",
            extra={"user_id": str(user_id), "score": score_detail.score},
        )
        return score_detail


    async def compute_and_save_risk_profile(
        self,
        user_id: UUID,
        statement_id: UUID,
        feature_vector: dict,
        ml_models: dict,
    ):
        """
        Runs pre-trained risk classifier from app.state.ml_models.
        Business logic placeholder — implement with notebook code.
        """
        # TODO: Port from 03_risk_profile_model.ipynb
        from app.enums.risk_profile_enum import RiskProfileEnum

        risk_level = RiskProfileEnum.MODERATE
        risk_score = 50.0
        confidence = 0.85

        model = ml_models.get("risk_profile_model")
        encoder = ml_models.get("risk_label_encoder")

        if model and encoder:
            import pandas as pd

            df = pd.DataFrame([feature_vector])
            prediction = model.predict(df)[0]
            probabilities = model.predict_proba(df)[0]
            risk_level_str = encoder.inverse_transform([prediction])[0]
            risk_level = RiskProfileEnum(risk_level_str.lower())
            confidence = float(max(probabilities))
            risk_score = confidence * 100

        record = await self._repo.save_risk_profile(
            {
                "user_id": user_id,
                "statement_id": statement_id,
                "risk_level": risk_level,
                "risk_score": round(risk_score, 2),
                "confidence": round(confidence, 4),
                "feature_inputs": feature_vector,
            }
        )

        logger.info(
            "Risk profile computed",
            extra={"user_id": str(user_id), "risk_level": risk_level},
        )
        return record
