"""Add AI Coach conversations and messages tables

Revision ID: 20260715_ai_coach_foundation
Revises: 20260714_financial_profile_chat
Create Date: 2026-07-15

Creates:
  - ai_coach_conversations
  - ai_coach_messages
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260715_ai_coach_foundation"
down_revision: Union[str, None] = "20260714_financial_profile_chat"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── ai_coach_conversations ────────────────────────────────────────────────
    op.create_table(
        "ai_coach_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(255),
            nullable=False,
            server_default="New Conversation",
        ),
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
        "ix_ai_coach_conversations_user_id",
        "ai_coach_conversations",
        ["user_id"],
    )

    # ── ai_coach_messages ─────────────────────────────────────────────────────
    op.create_table(
        "ai_coach_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_coach_conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # "user" | "assistant" | "system"
        sa.Column("role", sa.String(15), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        # Intent label produced by the classifier in Phase 2
        sa.Column("intent", sa.String(80), nullable=True),
        # Financial context snapshot at message send time
        sa.Column("context_snapshot_json", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_ai_coach_messages_conversation_id",
        "ai_coach_messages",
        ["conversation_id"],
    )
    op.create_index(
        "ix_ai_coach_messages_user_id",
        "ai_coach_messages",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ai_coach_messages_user_id",
        table_name="ai_coach_messages",
    )
    op.drop_index(
        "ix_ai_coach_messages_conversation_id",
        table_name="ai_coach_messages",
    )
    op.drop_table("ai_coach_messages")

    op.drop_index(
        "ix_ai_coach_conversations_user_id",
        table_name="ai_coach_conversations",
    )
    op.drop_table("ai_coach_conversations")
