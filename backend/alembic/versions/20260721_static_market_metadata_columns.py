"""Add static market metadata and governance columns to investment_products

Revision ID: 20260721_static_market_metadata
Revises: 20260720_investment_snapshots
Create Date: 2026-07-21

Creates:
  - rating, exit_load, riskometer, category_avg_return, tracking_error, underlying_index,
    metadata_version, last_reviewed, source columns on investment_products table
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260721_static_market_metadata"
down_revision: Union[str, None] = "20260720_investment_snapshots"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("investment_products", sa.Column("rating", sa.Float(), nullable=True))
    op.add_column("investment_products", sa.Column("exit_load", sa.String(length=255), nullable=True))
    op.add_column("investment_products", sa.Column("riskometer", sa.String(length=100), nullable=True))
    op.add_column("investment_products", sa.Column("category_avg_return", sa.Float(), nullable=True))
    op.add_column("investment_products", sa.Column("tracking_error", sa.Float(), nullable=True))
    op.add_column("investment_products", sa.Column("underlying_index", sa.String(length=100), nullable=True))
    op.add_column("investment_products", sa.Column("metadata_version", sa.Integer(), nullable=True, server_default="1"))
    op.add_column("investment_products", sa.Column("last_reviewed", sa.String(length=50), nullable=True))
    op.add_column("investment_products", sa.Column("source", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("investment_products", "source")
    op.drop_column("investment_products", "last_reviewed")
    op.drop_column("investment_products", "metadata_version")
    op.drop_column("investment_products", "underlying_index")
    op.drop_column("investment_products", "tracking_error")
    op.drop_column("investment_products", "category_avg_return")
    op.drop_column("investment_products", "riskometer")
    op.drop_column("investment_products", "exit_load")
    op.drop_column("investment_products", "rating")
