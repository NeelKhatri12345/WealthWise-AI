"""transaction_unique_constraint

Revision ID: 4cf34b8dfa62
Revises: 20260706_txn_confidence
Create Date: 2026-07-06 12:23:11.965852

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4cf34b8dfa62'
down_revision: Union[str, None] = '20260706_txn_confidence'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_transaction_identity",
        "transactions",
        ["user_id", "date", "amount", "description"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_transaction_identity", "transactions", type_="unique")
