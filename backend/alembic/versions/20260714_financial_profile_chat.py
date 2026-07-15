"""Add financial profile, chat, and health score snapshot tables

Revision ID: 20260714_financial_profile_chat
Revises: 20260707_portfolio_holdings
Create Date: 2026-07-14

Creates:
  - financial_profiles
  - financial_chat_sessions
  - financial_chat_messages
  - health_score_snapshots
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260714_financial_profile_chat"
down_revision: Union[str, None] = "20260707_portfolio_holdings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── financial_profiles ────────────────────────────────────────────────────
    op.create_table(
        "financial_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # Demographic / Employment
        sa.Column("age_range", sa.String(20), nullable=True),
        sa.Column("employment_type", sa.String(50), nullable=True),
        # Income
        sa.Column("monthly_income", sa.Numeric(15, 2), nullable=True),
        sa.Column("family_income", sa.Numeric(15, 2), nullable=True),
        sa.Column("earning_members", sa.Integer(), nullable=True),
        sa.Column("dependents_count", sa.Integer(), nullable=True),
        # Debt
        sa.Column("has_loans", sa.Boolean(), nullable=True),
        sa.Column("loan_types", postgresql.JSONB(), nullable=True),
        sa.Column("monthly_emi", sa.Numeric(15, 2), nullable=True),
        sa.Column("total_debt", sa.Numeric(15, 2), nullable=True),
        # Emergency Fund
        sa.Column("has_emergency_fund", sa.Boolean(), nullable=True),
        sa.Column("emergency_fund_months", sa.Float(), nullable=True),
        # Insurance
        sa.Column("has_health_insurance", sa.Boolean(), nullable=True),
        sa.Column("has_life_insurance", sa.Boolean(), nullable=True),
        # Investments
        sa.Column("monthly_investment", sa.Numeric(15, 2), nullable=True),
        sa.Column("investment_types", postgresql.JSONB(), nullable=True),
        # Risk & Goals
        sa.Column("risk_comfort", sa.String(20), nullable=True),
        sa.Column("financial_goals", postgresql.JSONB(), nullable=True),
        sa.Column("income_stability", sa.String(20), nullable=True),
        # Completion
        sa.Column(
            "profile_completion_percentage",
            sa.Float(),
            nullable=False,
            server_default="0.0",
        ),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_financial_profiles_user_id", "financial_profiles", ["user_id"]
    )
    op.create_unique_constraint(
        "uq_financial_profiles_user_id", "financial_profiles", ["user_id"]
    )

    # ── financial_chat_sessions ───────────────────────────────────────────────
    op.create_table(
        "financial_chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
        sa.Column("current_step", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_financial_chat_sessions_user_id", "financial_chat_sessions", ["user_id"]
    )

    # ── financial_chat_messages ───────────────────────────────────────────────
    op.create_table(
        "financial_chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_chat_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sender", sa.String(15), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("extracted_fields", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_financial_chat_messages_session_id",
        "financial_chat_messages",
        ["session_id"],
    )
    op.create_index(
        "ix_financial_chat_messages_user_id",
        "financial_chat_messages",
        ["user_id"],
    )

    # ── health_score_snapshots ────────────────────────────────────────────────
    op.create_table(
        "health_score_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "financial_profile_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Top-level score
        sa.Column("score", sa.Numeric(5, 2), nullable=False),
        sa.Column("band", sa.String(20), nullable=False),
        sa.Column("risk_profile", sa.String(20), nullable=True),
        # Component scores
        sa.Column("cash_flow_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("savings_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("spending_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("debt_burden_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("emergency_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("income_stability_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("investment_readiness_score", sa.Numeric(5, 2), nullable=True),
        # Explainability
        sa.Column("positive_factors", postgresql.JSONB(), nullable=True),
        sa.Column("negative_factors", postgresql.JSONB(), nullable=True),
        sa.Column("suggestions", postgresql.JSONB(), nullable=True),
        sa.Column("calculation_metadata", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_health_score_snapshots_user_id", "health_score_snapshots", ["user_id"]
    )
    op.create_index(
        "ix_health_score_snapshots_created_at",
        "health_score_snapshots",
        ["created_at"],
    )
    op.create_index(
        "ix_health_score_snapshots_financial_profile_id",
        "health_score_snapshots",
        ["financial_profile_id"],
    )


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_index(
        "ix_health_score_snapshots_financial_profile_id",
        table_name="health_score_snapshots",
    )
    op.drop_index(
        "ix_health_score_snapshots_created_at",
        table_name="health_score_snapshots",
    )
    op.drop_index(
        "ix_health_score_snapshots_user_id",
        table_name="health_score_snapshots",
    )
    op.drop_table("health_score_snapshots")

    op.drop_index(
        "ix_financial_chat_messages_user_id",
        table_name="financial_chat_messages",
    )
    op.drop_index(
        "ix_financial_chat_messages_session_id",
        table_name="financial_chat_messages",
    )
    op.drop_table("financial_chat_messages")

    op.drop_index(
        "ix_financial_chat_sessions_user_id",
        table_name="financial_chat_sessions",
    )
    op.drop_table("financial_chat_sessions")

    op.drop_unique_constraint(
        "uq_financial_profiles_user_id", "financial_profiles"
    )
    op.drop_index(
        "ix_financial_profiles_user_id", table_name="financial_profiles"
    )
    op.drop_table("financial_profiles")
