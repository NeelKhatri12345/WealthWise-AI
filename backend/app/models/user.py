"""
WealthWise AI - User ORM Model

Table: users
Relationships:
- ManyToOne → roles
- OneToMany → statements, health_scores, risk_profiles, portfolios, ai_conversations
"""

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # FK → roles
    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False
    )

    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users", lazy="selectin")
    statements: Mapped[list["Statement"]] = relationship(
        "Statement", back_populates="user", cascade="all, delete-orphan"
    )
    health_scores: Mapped[list["HealthScore"]] = relationship(
        "HealthScore", back_populates="user", cascade="all, delete-orphan"
    )
    risk_profiles: Mapped[list["RiskProfile"]] = relationship(
        "RiskProfile", back_populates="user", cascade="all, delete-orphan"
    )
    portfolios: Mapped[list["Portfolio"]] = relationship(
        "Portfolio", back_populates="user", cascade="all, delete-orphan"
    )
    ai_conversations: Mapped[list["AIConversation"]] = relationship(
        "AIConversation", back_populates="user", cascade="all, delete-orphan"
    )
    portfolio_holdings: Mapped[list["PortfolioHolding"]] = relationship(
        "PortfolioHolding", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
