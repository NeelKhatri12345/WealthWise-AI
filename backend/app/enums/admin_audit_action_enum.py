"""WealthWise AI - Admin Audit Action Enum"""

from enum import Enum


class AdminAuditActionEnum(str, Enum):
    ADMIN_LOGIN = "admin_login"
    VIEWED_USER = "viewed_user"
    DISABLED_USER = "disabled_user"
    ENABLED_USER = "enabled_user"
    DELETED_USER = "deleted_user"
