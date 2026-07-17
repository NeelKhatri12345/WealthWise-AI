"""WealthWise AI - Dashboard Service

Aggregates data from Transaction, HealthScore, and Analytics repositories
into dashboard-ready summary, insight, and notification payloads.
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Sequence
from uuid import UUID, uuid4

from app.core.logger import logger
from app.models.transaction import Transaction
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
from app.schemas.dashboard_schema import (
    DashboardInsightResponse,
    DashboardNotificationResponse,
    DashboardSummaryResponse,
    DashboardTransactionResponse,
)
from app.services.financial_metrics_service import FinancialMetricsService
from app.services.health_score_service import HealthScoreService


class DashboardService:

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        analytics_repo: AnalyticsRepository,
        metrics_service: FinancialMetricsService,
        health_score_service: HealthScoreService,
        snapshot_repo: HealthScoreSnapshotRepository,
    ) -> None:
        self._txn_repo = transaction_repo
        self._analytics_repo = analytics_repo
        self._metrics_service = metrics_service
        self._health_score_service = health_score_service
        self._snapshot_repo = snapshot_repo


    async def get_summary(self, user_id: UUID) -> DashboardSummaryResponse:
        """Build aggregated KPI summary from user's transactions and health score."""
        today = date.today()
        year, month = today.year, today.month

        # Current month aggregates
        raw = await self._txn_repo.get_monthly_aggregates(user_id, year, month)
        total_credits = Decimal("0")
        total_debits = Decimal("0")
        count = 0
        for row in raw.get("rows", []):
            amt = Decimal(str(row["total"] or 0))
            cnt = row["count"] or 0
            count += cnt
            if row["transaction_type"] == "credit":
                total_credits += amt
            else:
                total_debits += amt

        savings_rate = (
            ((total_credits - total_debits) / total_credits * 100)
            if total_credits > 0
            else Decimal("0")
        )

        # Latest health score
        health_score_val = Decimal("0")
        health_score_label = "N/A"
        try:
            snapshot = await self._snapshot_repo.get_latest_by_user(user_id)
            if snapshot:
                health_score_val = Decimal(str(snapshot.score))
                # Capitalize or keep band as is (e.g. "EXCELLENT", "GOOD" etc)
                health_score_label = snapshot.band
            else:
                metrics = await self._metrics_service.get_metrics(user_id)
                if metrics.transaction_count > 0:
                    score_detail = self._health_score_service.calculate_health_score(metrics)
                    health_score_val = Decimal(str(score_detail.score))
                    health_score_label = "Preliminary"
        except Exception as exc:
            logger.warning("Failed to compute or fetch health score for dashboard", exc_info=exc)


        # Approximate total balance from latest transaction's balance field
        latest_txns, _ = await self._txn_repo.get_by_user_filtered(
            user_id=user_id, limit=1
        )
        total_balance = Decimal("0")
        if latest_txns:
            total_balance = latest_txns[0].balance or Decimal("0")

        # Total aggregates (all transactions of user)
        total_aggs = await self._txn_repo.get_total_aggregates(user_id)
        total_income = total_aggs["total_income"]
        total_expenses = total_aggs["total_expenses"]

        logger.info(
            "Dashboard summary computed",
            extra={"user_id": str(user_id), "txn_count": count},
        )

        return DashboardSummaryResponse(
            total_balance=total_balance,
            monthly_income=total_credits,
            monthly_expenses=total_debits,
            total_income=total_income,
            total_expenses=total_expenses,
            savings_rate=round(savings_rate, 2),
            health_score=health_score_val,
            health_score_label=health_score_label,
            net_worth=total_balance,
            transaction_count=count,
        )

    async def get_recent_transactions(
        self, user_id: UUID, limit: int = 7
    ) -> list[DashboardTransactionResponse]:
        """Return the latest N transactions formatted for dashboard display."""
        txns, _ = await self._txn_repo.get_by_user_filtered(
            user_id=user_id, limit=limit
        )
        return [
            DashboardTransactionResponse(
                id=t.id,
                date=t.date.isoformat(),
                merchant=t.merchant,
                description=t.description,
                category=t.category,
                amount=t.amount,
                transaction_type=t.transaction_type,
            )
            for t in txns
        ]

    async def get_insights(self, user_id: UUID) -> list[DashboardInsightResponse]:
        """Generate contextual financial insights from user's data.

        These are computed from actual transaction data when available,
        with sensible defaults when the user has no data yet.
        """
        insights: list[DashboardInsightResponse] = []
        today = date.today()

        # Current month aggregates
        raw_current = await self._txn_repo.get_monthly_aggregates(
            user_id, today.year, today.month
        )
        current_debits = Decimal("0")
        categories_current: dict[str, Decimal] = {}
        for row in raw_current.get("rows", []):
            amt = Decimal(str(row["total"] or 0))
            if row["transaction_type"] == "debit":
                current_debits += amt
                cat = row["category"] or "Other"
                categories_current[cat] = (
                    categories_current.get(cat, Decimal("0")) + amt
                )

        # Previous month aggregates for comparison
        prev_date = today.replace(day=1) - timedelta(days=1)
        raw_prev = await self._txn_repo.get_monthly_aggregates(
            user_id, prev_date.year, prev_date.month
        )
        prev_debits = Decimal("0")
        categories_prev: dict[str, Decimal] = {}
        for row in raw_prev.get("rows", []):
            amt = Decimal(str(row["total"] or 0))
            if row["transaction_type"] == "debit":
                prev_debits += amt
                cat = row["category"] or "Other"
                categories_prev[cat] = categories_prev.get(cat, Decimal("0")) + amt

        # Spending trend insight
        if prev_debits > 0 and current_debits > 0:
            change_pct = float((current_debits - prev_debits) / prev_debits * 100)
            if change_pct > 5:
                insights.append(
                    DashboardInsightResponse(
                        id=str(uuid4()),
                        title="Spending Increase Detected",
                        description=(
                            f"Your expenses this month are up {abs(change_pct):.0f}% "
                            f"compared to last month. Consider reviewing discretionary spending."
                        ),
                        category="spending",
                        severity="warning",
                    )
                )
            elif change_pct < -5:
                insights.append(
                    DashboardInsightResponse(
                        id=str(uuid4()),
                        title="Great Savings Progress",
                        description=(
                            f"Your expenses decreased {abs(change_pct):.0f}% from last month. "
                            f"Keep up the great work!"
                        ),
                        category="savings",
                        severity="success",
                    )
                )

        # Top spending category insight
        if categories_current:
            top_cat = max(categories_current, key=lambda k: categories_current[k])
            top_amt = categories_current[top_cat]
            if current_debits > 0:
                pct = float(top_amt / current_debits * 100)
                insights.append(
                    DashboardInsightResponse(
                        id=str(uuid4()),
                        title=f"Top Spending: {top_cat}",
                        description=(
                            f"{top_cat} accounts for {pct:.0f}% of your monthly expenses "
                            f"(₹{float(top_amt):,.0f}). "
                            f"Consider if this aligns with your budget goals."
                        ),
                        category="category",
                        severity="info",
                    )
                )

        # Health score insight
        try:
            metrics = await self._metrics_service.get_metrics(user_id)
            if metrics.transaction_count > 0:
                score_detail = self._health_score_service.calculate_health_score(metrics)
                score_f = float(score_detail.score)
                if score_f >= 80:
                    insights.append(
                        DashboardInsightResponse(
                            id=str(uuid4()),
                            title="Excellent Financial Health",
                            description=(
                                f"Your health score is {score_f:.0f}/100. "
                                f"You're in great financial shape!"
                            ),
                            category="health",
                            severity="success",
                        )
                    )
                elif score_f < 50:
                    insights.append(
                        DashboardInsightResponse(
                            id=str(uuid4()),
                            title="Financial Health Needs Attention",
                            description=(
                                f"Your health score is {score_f:.0f}/100. "
                                f"Upload more statements and follow AI Coach recommendations."
                            ),
                            category="health",
                            severity="warning",
                        )
                    )
        except Exception as exc:
            logger.warning("Failed to compute on-demand health score for dashboard insights", exc_info=exc)


        # Default insight when no data
        if not insights:
            insights.append(
                DashboardInsightResponse(
                    id=str(uuid4()),
                    title="Get Started",
                    description=(
                        "Upload your first bank statement to receive personalized "
                        "financial insights and recommendations."
                    ),
                    category="onboarding",
                    severity="info",
                )
            )

        return insights

    async def get_notifications(
        self, user_id: UUID
    ) -> list[DashboardNotificationResponse]:
        """Return recent notifications for the dashboard.

        Derives notifications from user's financial events.
        """
        notifications: list[DashboardNotificationResponse] = []
        now = datetime.now()

        # Check for recent health score
        try:
            metrics = await self._metrics_service.get_metrics(user_id)
            if metrics.transaction_count > 0:
                score_detail = self._health_score_service.calculate_health_score(metrics)
                notifications.append(
                    DashboardNotificationResponse(
                        id=str(uuid4()),
                        title="Health Score Updated",
                        message=f"Your financial health score is {float(score_detail.score):.0f}/100.",
                        type="info",
                        read=False,
                        created_at=now.isoformat(),
                    )
                )
        except Exception as exc:
            logger.warning("Failed to compute on-demand health score for dashboard notifications", exc_info=exc)


        # Check for recent risk profile
        rp = await self._analytics_repo.get_latest_risk_profile(user_id)
        if rp:
            notifications.append(
                DashboardNotificationResponse(
                    id=str(uuid4()),
                    title="Risk Profile Available",
                    message=f"Your risk profile has been assessed as {rp.risk_level}.",
                    type="info",
                    read=False,
                    created_at=rp.calculated_at.isoformat(),
                )
            )

        # Welcome notification when no data
        if not notifications:
            notifications.append(
                DashboardNotificationResponse(
                    id=str(uuid4()),
                    title="Welcome to WealthWise AI",
                    message="Start by uploading a bank statement to unlock all features.",
                    type="success",
                    read=False,
                    created_at=now.isoformat(),
                )
            )

        return notifications
