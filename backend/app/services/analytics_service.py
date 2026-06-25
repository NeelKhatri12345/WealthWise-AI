"""WealthWise AI - Analytics Service

Computes Financial Health Score and Risk Profile from transactions.
Loads pre-trained ML models from app.state (loaded at startup in main.py).
"""

from typing import Sequence
from uuid import UUID

from fastapi import Request

from app.core.logger import logger
from app.exceptions.custom_exceptions import NotFoundException, ServiceUnavailableException
from app.models.transaction import Transaction
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.health_score_schema import HealthScoreResponse
from app.schemas.risk_profile_schema import RiskProfileResponse


class AnalyticsService:

    def __init__(self, analytics_repo: AnalyticsRepository) -> None:
        self._repo = analytics_repo

    async def get_latest_health_score(self, user_id: UUID) -> HealthScoreResponse:
        record = await self._repo.get_latest_health_score(user_id)
        if not record:
            raise NotFoundException(
                "No health score found. Please upload a bank statement first."
            )
        return HealthScoreResponse.from_orm_with_label(record)

    async def get_health_score_history(
        self, user_id: UUID, limit: int = 10
    ) -> list[HealthScoreResponse]:
        records = await self._repo.get_health_score_history(user_id, limit)
        return [HealthScoreResponse.from_orm_with_label(r) for r in records]

    async def get_health_score_by_statement(
        self, user_id: UUID, statement_id: UUID
    ) -> HealthScoreResponse:
        record = await self._repo.get_health_score_by_statement(statement_id)
        if not record or record.user_id != user_id:
            raise NotFoundException("Health score not found for this statement")
        return HealthScoreResponse.from_orm_with_label(record)

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
    ):
        """
        Computes financial health score from transaction list.
        Business logic placeholder — implement with notebook formulas.
        """
        # TODO: Port health score computation from 04_financial_health_score.ipynb
        # Placeholder implementation
        total_credits = sum(
            float(t.amount) for t in transactions if t.transaction_type == "credit"
        )
        total_debits = sum(
            float(t.amount) for t in transactions if t.transaction_type == "debit"
        )
        savings_rate = ((total_credits - total_debits) / total_credits * 100) if total_credits else 0
        expense_ratio = (total_debits / total_credits * 100) if total_credits else 100
        overall_score = max(0.0, min(100.0, savings_rate))

        record = await self._repo.save_health_score({
            "user_id": user_id,
            "statement_id": statement_id,
            "overall_score": round(overall_score, 2),
            "savings_rate": round(savings_rate, 2),
            "expense_ratio": round(expense_ratio, 2),
            "score_breakdown": {
                "total_credits": total_credits,
                "total_debits": total_debits,
            },
        })

        logger.info(
            "Health score computed",
            extra={"user_id": str(user_id), "score": overall_score},
        )
        return record

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

        record = await self._repo.save_risk_profile({
            "user_id": user_id,
            "statement_id": statement_id,
            "risk_level": risk_level,
            "risk_score": round(risk_score, 2),
            "confidence": round(confidence, 4),
            "feature_inputs": feature_vector,
        })

        logger.info(
            "Risk profile computed",
            extra={"user_id": str(user_id), "risk_level": risk_level},
        )
        return record
