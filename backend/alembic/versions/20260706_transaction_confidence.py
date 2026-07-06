"""Add confidence_score to transactions

Revision ID: 20260706_txn_confidence
Revises: 20260625_processing
Create Date: 2026-07-06

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260706_txn_confidence"
down_revision: Union[str, None] = "20260625_processing"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "transactions",
        sa.Column("confidence_score", sa.Numeric(4, 3), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("transactions", "confidence_score")
