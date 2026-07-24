"""WealthWise AI - Admin Service"""

from datetime import datetime
from uuid import UUID

from app.enums.admin_audit_action_enum import AdminAuditActionEnum
from app.enums.role_enum import RoleEnum
from app.exceptions.custom_exceptions import ForbiddenException, NotFoundException
from app.repositories.admin_analytics_repository import AdminAnalyticsRepository
from app.repositories.ai_coach_repository import AICoachRepository
from app.repositories.financial_profile_repository import FinancialProfileRepository
from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
from app.repositories.investment_recommendation_repository import (
    InvestmentRecommendationRepository,
)
from app.repositories.statement_repository import StatementRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin_schema import (
    ActivityLogResponse,
    ActivityTypeOption,
    AdminAnalyticsResponse,
    AdminAuditActionOption,
    AdminAuditLogResponse,
    AdminStatsResponse,
    AdminUserDetailResponse,
    AdminUserProfileSummary,
    AdminUserStatementItem,
    AnalyticsMetricPoint,
    RiskProfileDistributionItem,
)
from app.services.activity_log_service import ActivityLogService
from app.services.admin_audit_log_service import AdminAuditLogService
from app.schemas.user_schema import UserResponse


class AdminService:

    def __init__(
        self,
        user_repo: UserRepository,
        statement_repo: StatementRepository,
        ai_coach_repo: AICoachRepository,
        investment_repo: InvestmentRecommendationRepository,
        health_snapshot_repo: HealthScoreSnapshotRepository,
        profile_repo: FinancialProfileRepository,
        activity_log_service: ActivityLogService,
        admin_analytics_repo: AdminAnalyticsRepository,
        admin_audit_log_service: AdminAuditLogService,
    ) -> None:
        self._user_repo = user_repo
        self._statement_repo = statement_repo
        self._ai_coach_repo = ai_coach_repo
        self._investment_repo = investment_repo
        self._health_snapshot_repo = health_snapshot_repo
        self._profile_repo = profile_repo
        self._activity_log_service = activity_log_service
        self._admin_analytics_repo = admin_analytics_repo
        self._admin_audit = admin_audit_log_service

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role_filter: str | None = None,
        is_active: bool | None = None,
        search: str | None = None,
        include_deleted: bool = False,
    ) -> tuple[list[UserResponse], int]:
        users = await self._user_repo.get_all_users(
            skip, limit, role_filter, is_active, search, include_deleted
        )
        total = await self._user_repo.count_users(
            role_filter, is_active, search, include_deleted
        )
        return [UserResponse.from_orm_with_role(u) for u in users], total

    async def get_user_detail(
        self, user_id: UUID, admin_id: UUID
    ) -> AdminUserDetailResponse:
        user = await self._user_repo.get_by_id(user_id, include_deleted=True)
        if not user:
            raise NotFoundException("User not found")

        snapshot = await self._health_snapshot_repo.get_latest_by_user(user_id)
        profile = await self._profile_repo.get_by_user_id(user_id)
        statements = await self._statement_repo.get_by_user(user_id, limit=10)

        statements_count = await self._statement_repo.count_by_user(user_id)
        ai_chats_count = await self._ai_coach_repo.count_messages_by_user(user_id)
        investment_plans_count = await self._investment_repo.count_by_user(user_id)

        profile_summary = None
        if profile:
            profile_summary = AdminUserProfileSummary(
                profile_completion_percentage=profile.profile_completion_percentage,
                monthly_income=profile.monthly_income,
                risk_comfort=profile.risk_comfort,
                employment_type=profile.employment_type,
                financial_goals=profile.financial_goals,
            )

        detail = AdminUserDetailResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_deleted=user.is_deleted,
            role_name=user.role.name if user.role else "",
            created_at=user.created_at,
            last_login_at=user.last_login_at,
            health_score=float(snapshot.score) if snapshot else None,
            health_band=snapshot.band if snapshot else None,
            risk_profile=snapshot.risk_profile if snapshot else None,
            statements_count=statements_count,
            ai_chats_count=ai_chats_count,
            investment_plans_count=investment_plans_count,
            profile=profile_summary,
            statements=[
                AdminUserStatementItem(
                    id=s.id,
                    file_name=s.file_name,
                    status=s.status.value if hasattr(s.status, "value") else str(s.status),
                    created_at=s.created_at,
                )
                for s in statements
            ],
        )

        await self._admin_audit.log(
            admin_id=admin_id,
            action=AdminAuditActionEnum.VIEWED_USER,
            target_user_id=user.id,
            description=f"Viewed user {user.email}",
        )
        return detail

    async def toggle_user_status(self, user_id: UUID, admin_id: UUID) -> UserResponse:
        user = await self._user_repo.get_by_id(user_id, include_deleted=True)
        if not user:
            raise NotFoundException("User not found")
        if user.is_deleted:
            raise ForbiddenException("Cannot modify a deleted user")
        if user.role and user.role.name == RoleEnum.ADMIN.value:
            raise ForbiddenException("Cannot modify admin account status")

        if user.is_active:
            updated = await self._user_repo.deactivate(user)
            await self._admin_audit.log(
                admin_id=admin_id,
                action=AdminAuditActionEnum.DISABLED_USER,
                target_user_id=user.id,
                description=f"Disabled user {user.email}",
            )
        else:
            updated = await self._user_repo.activate(user)
            await self._admin_audit.log(
                admin_id=admin_id,
                action=AdminAuditActionEnum.ENABLED_USER,
                target_user_id=user.id,
                description=f"Enabled user {user.email}",
            )
        return UserResponse.from_orm_with_role(updated)

    async def soft_delete_user(self, user_id: UUID, admin_id: UUID) -> UserResponse:
        user = await self._user_repo.get_by_id(user_id, include_deleted=True)
        if not user:
            raise NotFoundException("User not found")
        if user.is_deleted:
            raise ForbiddenException("User is already deleted")
        if user.role and user.role.name == RoleEnum.ADMIN.value:
            raise ForbiddenException("Cannot delete admin accounts")

        updated = await self._user_repo.soft_delete(user)
        await self._admin_audit.log(
            admin_id=admin_id,
            action=AdminAuditActionEnum.DELETED_USER,
            target_user_id=user.id,
            description=f"Deleted user {user.email}",
        )
        return UserResponse.from_orm_with_role(updated)

    async def get_system_stats(self) -> AdminStatsResponse:
        total_users = await self._user_repo.count_users(include_deleted=False)
        active_users = await self._user_repo.count_active()
        total_statements = await self._statement_repo.count()
        total_ai_chats = await self._ai_coach_repo.count_all_messages()
        total_investment_plans = await self._investment_repo.count()
        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            total_statements=total_statements,
            total_ai_chats=total_ai_chats,
            total_investment_plans=total_investment_plans,
        )

    async def get_activity_logs(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        user_id: UUID | None = None,
        activity_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[ActivityLogResponse], int]:
        return await self._activity_log_service.get_logs(
            skip=skip,
            limit=limit,
            user_id=user_id,
            activity_type=activity_type,
            date_from=date_from,
            date_to=date_to,
        )

    def get_activity_types(self) -> list[ActivityTypeOption]:
        return [
            ActivityTypeOption(**item)
            for item in ActivityLogService.activity_type_labels()
        ]

    async def get_analytics(self, days: int = 7) -> AdminAnalyticsResponse:
        raw = await self._admin_analytics_repo.get_analytics_summary(days)
        return AdminAnalyticsResponse(
            daily_active_users=raw["daily_active_users"],
            total_ai_requests=raw["total_ai_requests"],
            total_statements_uploaded=raw["total_statements_uploaded"],
            average_health_score=raw["average_health_score"],
            average_risk_profile=raw["average_risk_profile"],
            daily_active_users_trend=[
                AnalyticsMetricPoint(**p) for p in raw["daily_active_users_trend"]
            ],
            ai_requests_trend=[
                AnalyticsMetricPoint(**p) for p in raw["ai_requests_trend"]
            ],
            statements_trend=[
                AnalyticsMetricPoint(**p) for p in raw["statements_trend"]
            ],
            health_score_trend=[
                AnalyticsMetricPoint(**p) for p in raw["health_score_trend"]
            ],
            risk_profile_distribution=[
                RiskProfileDistributionItem(**p)
                for p in raw["risk_profile_distribution"]
            ],
        )

    async def get_audit_logs(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        admin_id: UUID | None = None,
        action: str | None = None,
        target_user_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AdminAuditLogResponse], int]:
        return await self._admin_audit.get_logs(
            skip=skip,
            limit=limit,
            admin_id=admin_id,
            action=action,
            target_user_id=target_user_id,
            date_from=date_from,
            date_to=date_to,
        )

    def get_audit_actions(self) -> list[AdminAuditActionOption]:
        return AdminAuditLogService.get_action_options()
