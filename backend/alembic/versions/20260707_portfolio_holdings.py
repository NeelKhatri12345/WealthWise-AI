"""Add portfolio_holdings table

Revision ID: 20260707_portfolio_holdings
Revises: 4cf34b8dfa62
Create Date: 2026-07-07

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260707_portfolio_holdings"
down_revision: Union[str, None] = "4cf34b8dfa62"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "portfolio_holdings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("asset_name", sa.String(255), nullable=False),
        sa.Column("asset_type", sa.String(50), nullable=False),
        sa.Column("symbol", sa.String(50), nullable=True),
        sa.Column("quantity", sa.Numeric(18, 4), nullable=False),
        sa.Column("average_buy_price", sa.Numeric(15, 2), nullable=False),
        sa.Column("current_price", sa.Numeric(15, 2), nullable=False),
        sa.Column("invested_value", sa.Numeric(18, 2), nullable=False),
        sa.Column("current_value", sa.Numeric(18, 2), nullable=False),
        sa.Column("profit_loss", sa.Numeric(18, 2), nullable=False),
        sa.Column("profit_loss_percentage", sa.Numeric(12, 4), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
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
        "ix_portfolio_holdings_user_id", "portfolio_holdings", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_portfolio_holdings_user_id", table_name="portfolio_holdings")
    op.drop_table("portfolio_holdings")
