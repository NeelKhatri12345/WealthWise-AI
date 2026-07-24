"""WealthWise AI - Admin API Schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AdminStatsResponse(BaseModel):
    total_users: int = Field(..., ge=0)
    active_users: int = Field(..., ge=0)
    total_statements: int = Field(..., ge=0)
    total_ai_chats: int = Field(..., ge=0)
    total_investment_plans: int = Field(..., ge=0)


class AdminUserProfileSummary(BaseModel):
    profile_completion_percentage: Optional[float] = None
    monthly_income: Optional[Decimal] = None
    risk_comfort: Optional[str] = None
    employment_type: Optional[str] = None
    financial_goals: Optional[list] = None


class AdminUserStatementItem(BaseModel):
    id: UUID
    file_name: str
    status: str
    created_at: datetime


class AdminUserDetailResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_deleted: bool
    role_name: str
    created_at: datetime
    last_login_at: Optional[datetime] = None
    health_score: Optional[float] = None
    health_band: Optional[str] = None
    risk_profile: Optional[str] = None
    statements_count: int = 0
    ai_chats_count: int = 0
    investment_plans_count: int = 0
    profile: Optional[AdminUserProfileSummary] = None
    statements: list[AdminUserStatementItem] = Field(default_factory=list)


class ActivityLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    user_email: str
    activity_type: str
    description: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime

    @classmethod
    def from_orm(cls, log) -> "ActivityLogResponse":
        user = log.user
        return cls(
            id=log.id,
            user_id=log.user_id,
            user_name=user.full_name if user else "Unknown",
            user_email=user.email if user else "",
            activity_type=log.activity_type,
            description=log.description,
            metadata=log.metadata_json,
            created_at=log.created_at,
        )


class ActivityTypeOption(BaseModel):
    value: str
    label: str


class AdminAuditLogResponse(BaseModel):
    id: UUID
    admin_id: UUID
    admin_name: str
    admin_email: str
    action: str
    target_user_id: Optional[UUID] = None
    target_user_name: Optional[str] = None
    target_user_email: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime

    @classmethod
    def from_orm(cls, log) -> "AdminAuditLogResponse":
        admin = log.admin
        target = log.target_user
        return cls(
            id=log.id,
            admin_id=log.admin_id,
            admin_name=admin.full_name if admin else "Unknown",
            admin_email=admin.email if admin else "",
            action=log.action,
            target_user_id=log.target_user_id,
            target_user_name=target.full_name if target else None,
            target_user_email=target.email if target else None,
            description=log.description,
            metadata=log.metadata_json,
            created_at=log.created_at,
        )


class AdminAuditActionOption(BaseModel):
    value: str
    label: str


class AnalyticsMetricPoint(BaseModel):
    date: str
    value: float


class RiskProfileDistributionItem(BaseModel):
    label: str
    value: int = Field(..., ge=0)


class AdminAnalyticsResponse(BaseModel):
    daily_active_users: int = Field(..., ge=0)
    total_ai_requests: int = Field(..., ge=0)
    total_statements_uploaded: int = Field(..., ge=0)
    average_health_score: Optional[float] = None
    average_risk_profile: Optional[str] = None
    daily_active_users_trend: list[AnalyticsMetricPoint] = Field(default_factory=list)
    ai_requests_trend: list[AnalyticsMetricPoint] = Field(default_factory=list)
    statements_trend: list[AnalyticsMetricPoint] = Field(default_factory=list)
    health_score_trend: list[AnalyticsMetricPoint] = Field(default_factory=list)
    risk_profile_distribution: list[RiskProfileDistributionItem] = Field(default_factory=list)


class ServiceMonitorItem(BaseModel):
    name: str
    label: str
    status: str = Field(..., pattern="^(online|offline)$")
    latency_ms: Optional[float] = Field(default=None, ge=0)
    message: Optional[str] = None


class SystemMonitoringResponse(BaseModel):
    checked_at: datetime
    services: list[ServiceMonitorItem] = Field(default_factory=list)
