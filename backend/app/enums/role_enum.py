"""WealthWise AI - Role Enum"""

from enum import Enum


class RoleEnum(str, Enum):
    """
    User roles for Role-Based Access Control (RBAC).
    Stored as string in DB for human readability.
    """

    ADMIN = "admin"
    USER = "user"
    ANALYST = "analyst"  # Read-only analytics access across all users
