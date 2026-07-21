"""Add investment_recommendation_snapshots table

Revision ID: 20260720_investment_recommendation_snapshots
Revises: 20260715_ai_coach_foundation
Create Date: 2026-07-20

Creates:
  - investment_recommendation_snapshots
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260720_investment_snapshots"
down_revision: Union[str, None] = "20260715_ai_coach_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "investment_recommendation_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "health_score_snapshot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("health_score_snapshots.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "risk_profile_snapshot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("risk_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Readiness
        sa.Column("investment_readiness", sa.String(64), nullable=False),
        sa.Column("investment_readiness_score", sa.Numeric(5, 2), nullable=True),
        # Strategy
        sa.Column("recommended_strategy", sa.String(64), nullable=False),
        # Investable amount
        sa.Column("monthly_investable_amount", sa.Numeric(15, 2), nullable=True),
        # JSONB columns
        sa.Column("allocation_json", postgresql.JSONB(), nullable=True),
        sa.Column("reasoning_json", postgresql.JSONB(), nullable=True),
        sa.Column("warnings_json", postgresql.JSONB(), nullable=True),
        sa.Column("action_plan_json", postgresql.JSONB(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        # Timestamps
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_investment_recommendation_snapshots_user_id",
        "investment_recommendation_snapshots",
        ["user_id"],
    )
    op.create_index(
        "ix_investment_recommendation_snapshots_created_at",
        "investment_recommendation_snapshots",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_investment_recommendation_snapshots_created_at",
        table_name="investment_recommendation_snapshots",
    )
    op.drop_index(
        "ix_investment_recommendation_snapshots_user_id",
        table_name="investment_recommendation_snapshots",
    )
    op.drop_table("investment_recommendation_snapshots")
