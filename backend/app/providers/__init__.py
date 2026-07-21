"""
WealthWise AI — Product Providers Package

Exports:
  AbstractProductProvider  — interface (ABC)
  JSONProductProvider      — Milestone 1 static implementation
  ProductRecord            — catalog identity model
  MarketMetadata           — live enrichment model (M2+)
  UserContext              — scoring engine input model
"""

from app.providers.abstract_product_provider import AbstractProductProvider
from app.providers.json_product_provider import JSONProductProvider
from app.providers.models import MarketMetadata, ProductRecord, UserContext

__all__ = [
    "AbstractProductProvider",
    "JSONProductProvider",
    "MarketMetadata",
    "ProductRecord",
    "UserContext",
]
