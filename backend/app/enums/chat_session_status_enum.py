"""WealthWise AI - Chat Session Status Enum

Lifecycle for a financial profile chat session.

State machine
─────────────
  active ──► completed
     │
     └──► archived   (user explicitly chose to retake the assessment)

active     Session is in progress; user is answering questions.
completed  All 10 steps answered; profile is complete.
archived   User started a new assessment; this session is preserved for audit.
"""

from enum import Enum


class ChatSessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"

    # ── Convenience helpers ───────────────────────────────────────────────────

    def is_resumable(self) -> bool:
        """True if this session can be picked up by start_session."""
        return self == ChatSessionStatus.ACTIVE

    def is_terminal(self) -> bool:
        """True if no further transitions are expected."""
        return self in (ChatSessionStatus.COMPLETED, ChatSessionStatus.ARCHIVED)
