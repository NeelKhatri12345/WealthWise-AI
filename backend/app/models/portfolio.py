"""WealthWise AI - Portfolio ORM Model"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin


class Portfolio(UUIDMixin, Base):
    __tablename__ = "portfolios"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    risk_profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("risk_profiles.id", ondelete="CASCADE"), nullable=False
    )

    # JSONB array of asset allocation dicts
    # e.g. [{"asset": "Large Cap Equity", "allocation_pct": 40.0, "rationale": "..."}]
    recommendations: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    rebalance_frequency: Mapped[str] = mapped_column(
        String(20), nullable=False, default="quarterly"
    )
    narrative: Mapped[str | None] = mapped_column(
        JSONB, nullable=True
    )  # Gemini explanation

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolios")
    risk_profile: Mapped["RiskProfile"] = relationship(
        "RiskProfile", back_populates="portfolios"
    )
