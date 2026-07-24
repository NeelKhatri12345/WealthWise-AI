"""WealthWise AI - Admin Analytics Repository (platform-wide aggregations)"""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import Date, cast, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.models.ai_coach_message import AICoachMessage
from app.models.health_score_snapshot import HealthScoreSnapshot
from app.models.statement import Statement


class AdminAnalyticsRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _day_range(days: int) -> tuple[datetime, list[str]]:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        start = today - timedelta(days=days - 1)
        categories = [
            (start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)
        ]
        return start, categories

    async def count_daily_active_users(self, day_start: datetime, day_end: datetime) -> int:
        stmt = select(func.count(distinct(ActivityLog.user_id))).where(
            ActivityLog.created_at >= day_start,
            ActivityLog.created_at < day_end,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def daily_active_users_trend(self, days: int = 7) -> list[dict[str, Any]]:
        start, categories = self._day_range(days)
        stmt = (
            select(
                cast(ActivityLog.created_at, Date).label("day"),
                func.count(distinct(ActivityLog.user_id)).label("count"),
            )
            .where(ActivityLog.created_at >= start)
            .group_by("day")
            .order_by("day")
        )
        result = await self.db.execute(stmt)
        by_day = {row.day.isoformat(): row.count for row in result.all()}
        return [{"date": d, "value": by_day.get(d, 0)} for d in categories]

    async def total_ai_requests(self) -> int:
        stmt = select(func.count()).select_from(AICoachMessage).where(
            AICoachMessage.role == "user"
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def ai_requests_trend(self, days: int = 7) -> list[dict[str, Any]]:
        start, categories = self._day_range(days)
        stmt = (
            select(
                cast(AICoachMessage.created_at, Date).label("day"),
                func.count().label("count"),
            )
            .where(
                AICoachMessage.created_at >= start,
                AICoachMessage.role == "user",
            )
            .group_by("day")
            .order_by("day")
        )
        result = await self.db.execute(stmt)
        by_day = {row.day.isoformat(): row.count for row in result.all()}
        return [{"date": d, "value": by_day.get(d, 0)} for d in categories]

    async def total_statements_uploaded(self) -> int:
        stmt = select(func.count()).select_from(Statement)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def statements_upload_trend(self, days: int = 7) -> list[dict[str, Any]]:
        start, categories = self._day_range(days)
        stmt = (
            select(
                cast(Statement.created_at, Date).label("day"),
                func.count().label("count"),
            )
            .where(Statement.created_at >= start)
            .group_by("day")
            .order_by("day")
        )
        result = await self.db.execute(stmt)
        by_day = {row.day.isoformat(): row.count for row in result.all()}
        return [{"date": d, "value": by_day.get(d, 0)} for d in categories]

    def _latest_snapshots_subquery(self):
        return (
            select(
                HealthScoreSnapshot.user_id,
                func.max(HealthScoreSnapshot.created_at).label("max_created"),
            )
            .group_by(HealthScoreSnapshot.user_id)
            .subquery()
        )

    async def average_health_score(self) -> float | None:
        latest = self._latest_snapshots_subquery()
        stmt = (
            select(func.avg(HealthScoreSnapshot.score))
            .join(
                latest,
                (HealthScoreSnapshot.user_id == latest.c.user_id)
                & (HealthScoreSnapshot.created_at == latest.c.max_created),
            )
        )
        result = await self.db.execute(stmt)
        value = result.scalar_one()
        return round(float(value), 1) if value is not None else None

    async def health_score_trend(self, days: int = 7) -> list[dict[str, Any]]:
        start, categories = self._day_range(days)
        stmt = (
            select(
                cast(HealthScoreSnapshot.created_at, Date).label("day"),
                func.avg(HealthScoreSnapshot.score).label("avg_score"),
            )
            .where(HealthScoreSnapshot.created_at >= start)
            .group_by("day")
            .order_by("day")
        )
        result = await self.db.execute(stmt)
        by_day = {
            row.day.isoformat(): round(float(row.avg_score), 1)
            for row in result.all()
            if row.avg_score is not None
        }
        return [{"date": d, "value": by_day.get(d, 0)} for d in categories]

    async def risk_profile_stats(self) -> tuple[str | None, list[dict[str, Any]]]:
        latest = self._latest_snapshots_subquery()
        stmt = (
            select(
                HealthScoreSnapshot.risk_profile,
                func.count().label("count"),
            )
            .join(
                latest,
                (HealthScoreSnapshot.user_id == latest.c.user_id)
                & (HealthScoreSnapshot.created_at == latest.c.max_created),
            )
            .where(HealthScoreSnapshot.risk_profile.isnot(None))
            .group_by(HealthScoreSnapshot.risk_profile)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        if not rows:
            return None, []

        risk_map = {"CONSERVATIVE": 1, "MODERATE": 2, "AGGRESSIVE": 3}
        total_weight = 0
        total_count = 0
        distribution = []
        for row in rows:
            profile = row.risk_profile
            count = row.count
            distribution.append({"label": profile, "value": count})
            key = profile.upper() if profile else ""
            if key in risk_map:
                total_weight += risk_map[key] * count
                total_count += count

        if total_count == 0:
            return None, distribution

        avg_numeric = total_weight / total_count
        if avg_numeric < 1.5:
            avg_label = "Conservative"
        elif avg_numeric < 2.5:
            avg_label = "Moderate"
        else:
            avg_label = "Aggressive"
        return avg_label, distribution

    async def get_analytics_summary(self, days: int = 7) -> dict[str, Any]:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        daily_active = await self.count_daily_active_users(today, tomorrow)
        avg_health = await self.average_health_score()
        avg_risk, risk_distribution = await self.risk_profile_stats()

        return {
            "daily_active_users": daily_active,
            "total_ai_requests": await self.total_ai_requests(),
            "total_statements_uploaded": await self.total_statements_uploaded(),
            "average_health_score": avg_health,
            "average_risk_profile": avg_risk,
            "daily_active_users_trend": await self.daily_active_users_trend(days),
            "ai_requests_trend": await self.ai_requests_trend(days),
            "statements_trend": await self.statements_upload_trend(days),
            "health_score_trend": await self.health_score_trend(days),
            "risk_profile_distribution": risk_distribution,
        }
