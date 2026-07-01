"""
WealthWise AI - Models Package

Import all models here so Alembic's env.py can discover them
via Base.metadata when autogenerating migrations.
"""

from app.models.ai_conversation import AIConversation
from app.models.health_score import HealthScore
from app.models.portfolio import Portfolio
from app.models.risk_profile import RiskProfile
from app.models.role import Role
from app.models.statement import Statement
from app.models.transaction import Transaction
from app.models.user import User

__all__ = [
    "User",
    "Role",
    "Statement",
    "Transaction",
    "HealthScore",
    "RiskProfile",
    "Portfolio",
    "AIConversation",
]
