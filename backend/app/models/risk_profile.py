"""WealthWise AI - RiskProfile ORM Model"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin
from app.enums.risk_profile_enum import RiskProfileEnum


class RiskProfile(UUIDMixin, Base):
    __tablename__ = "risk_profiles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    statement_id: Mapped[UUID] = mapped_column(
        ForeignKey("statements.id", ondelete="CASCADE"), nullable=False
    )

    risk_level: Mapped[RiskProfileEnum] = mapped_column(
        SAEnum(RiskProfileEnum, name="riskprofileenum", create_constraint=True),
        nullable=False,
    )
    risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4), nullable=True)
    feature_inputs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="risk_profiles")
    statement: Mapped["Statement"] = relationship("Statement", back_populates="risk_profiles")
    portfolios: Mapped[list["Portfolio"]] = relationship(
        "Portfolio", back_populates="risk_profile"
    )
