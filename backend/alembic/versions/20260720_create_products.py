"""Create investment_products table

Revision ID: 20260720_create_products
Revises: 20260720_investment_snapshots
Create Date: 2026-07-20

Creates:
  - investment_products table with all initial columns
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260720_create_products"
down_revision: Union[str, None] = "20260720_investment_snapshots"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "investment_products",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("symbol", sa.String(length=50), nullable=True),
        sa.Column("isin", sa.String(length=50), nullable=True),
        sa.Column("amfi_code", sa.String(length=50), nullable=True),
        sa.Column("product_type", sa.String(length=50), nullable=False),
        sa.Column("asset_class", sa.String(length=50), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("fund_house", sa.String(length=100), nullable=True),
        sa.Column("sector", sa.String(length=100), nullable=False),
        sa.Column("investment_style", sa.String(length=100), nullable=False),
        # Eligibility Gates
        sa.Column("risk_level", sa.String(length=20), nullable=False),
        sa.Column("minimum_strategy", sa.String(length=20), nullable=False),
        sa.Column("minimum_health_score", sa.Float(), nullable=False),
        sa.Column("minimum_investable_amount", sa.Float(), nullable=False),
        # Suitability vectors & copy
        sa.Column("suitable_goals", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("suitable_age_ranges", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("suitable_horizons", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("suitable_income_stability", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("reason_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("regulatory_note", sa.Text(), nullable=False),
        # Stored Market Data (Fallback & Static values)
        sa.Column("nav", sa.Float(), nullable=True),
        sa.Column("current_price", sa.Float(), nullable=True),
        sa.Column("market_cap_cr", sa.Float(), nullable=True),
        sa.Column("dividend_yield", sa.Float(), nullable=True),
        sa.Column("expected_return_1y", sa.Float(), nullable=True),
        sa.Column("expected_return_3y", sa.Float(), nullable=True),
        sa.Column("expense_ratio", sa.Float(), nullable=True),
        sa.Column("aum_cr", sa.Float(), nullable=True),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    # Indexes
    op.create_index("ix_investment_products_id", "investment_products", ["id"], unique=False)
    op.create_index("ix_investment_products_symbol", "investment_products", ["symbol"], unique=False)
    op.create_index("ix_investment_products_isin", "investment_products", ["isin"], unique=False)
    op.create_index("ix_investment_products_amfi_code", "investment_products", ["amfi_code"], unique=False)
    op.create_index("ix_investment_products_product_type", "investment_products", ["product_type"], unique=False)
    op.create_index("ix_investment_products_asset_class", "investment_products", ["asset_class"], unique=False)
    op.create_index("ix_investment_products_category", "investment_products", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_investment_products_category", table_name="investment_products")
    op.drop_index("ix_investment_products_asset_class", table_name="investment_products")
    op.drop_index("ix_investment_products_product_type", table_name="investment_products")
    op.drop_index("ix_investment_products_amfi_code", table_name="investment_products")
    op.drop_index("ix_investment_products_isin", table_name="investment_products")
    op.drop_index("ix_investment_products_symbol", table_name="investment_products")
    op.drop_index("ix_investment_products_id", table_name="investment_products")
    op.drop_table("investment_products")
