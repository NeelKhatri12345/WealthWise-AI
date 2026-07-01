"""
WealthWise AI - Pydantic V2 Schemas

Shared base response wrapper and common types.
"""

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standardized API response envelope.
    All route handlers return this wrapper for consistency.

    Example:
        return APIResponse(
            success=True,
            message="User retrieved successfully",
            data=user_schema,
            meta={"request_id": "abc123"}
        )
    """

    success: bool
    message: str
    data: Optional[T] = None
    errors: Optional[List[str]] = None
    meta: Optional[dict] = None


class PaginationMeta(BaseModel):
    """Pagination metadata included in list responses."""

    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response wrapper."""

    success: bool = True
    message: str = "Data retrieved successfully"
    data: List[T]
    meta: PaginationMeta
