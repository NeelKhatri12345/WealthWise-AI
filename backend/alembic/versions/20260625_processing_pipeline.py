"""Add statement processing pipeline fields and enum values

Revision ID: 20260625_processing
Revises: 5b10b3f6c795
Create Date: 2026-06-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260625_processing"
down_revision: Union[str, None] = "5b10b3f6c795"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend PostgreSQL enum with new lifecycle values (lowercase, matching Python enum).
    bind = op.get_bind()
    if bind.engine.name == 'postgresql':
        op.execute("ALTER TYPE statementstatusenum ADD VALUE IF NOT EXISTS 'uploaded'")
        op.execute("ALTER TYPE statementstatusenum ADD VALUE IF NOT EXISTS 'ocr_completed'")
        op.execute("ALTER TYPE statementstatusenum ADD VALUE IF NOT EXISTS 'parsing'")
    # Legacy rows may still use uppercase names from the initial migration.
        op.execute("ALTER TYPE statementstatusenum ADD VALUE IF NOT EXISTS 'pending'")

    op.add_column(
        "statements",
        sa.Column(
            "processing_metadata",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'),
            nullable=True,
        ),
    )
    op.add_column(
        "statements",
        sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "statements",
        sa.Column("ocr_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "statements",
        sa.Column("parsing_started_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("statements", "parsing_started_at")
    op.drop_column("statements", "ocr_completed_at")
    op.drop_column("statements", "processing_started_at")
    op.drop_column("statements", "processing_metadata")
    # PostgreSQL does not support removing individual enum values safely.
