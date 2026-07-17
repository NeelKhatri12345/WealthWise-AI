"""
WealthWise AI - Role ORM Model

Table: roles
Pre-seeded rows: admin, user, analyst
"""

from sqlalchemy import Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDMixin
from app.enums.role_enum import RoleEnum


class Role(UUIDMixin, Base):
    __tablename__ = "roles"

    name: Mapped[RoleEnum] = mapped_column(
        SAEnum(RoleEnum, name="roleenum", create_constraint=True),
        unique=True,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role name={self.name}>"
