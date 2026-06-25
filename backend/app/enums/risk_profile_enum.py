"""WealthWise AI - Risk Profile Enum"""

from enum import Enum


class RiskProfileEnum(str, Enum):
    """
    Risk tolerance levels used by the ML risk classifier and portfolio engine.
    Maps to asset allocation strategies in portfolio_service.py.
    """

    CONSERVATIVE = "conservative"  # Low risk, stable returns
    MODERATE = "moderate"  # Balanced risk/return
    AGGRESSIVE = "aggressive"  # High risk, high return potential
    VERY_AGGRESSIVE = "very_aggressive"  # Maximum risk tolerance
