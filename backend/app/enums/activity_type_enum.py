"""WealthWise AI - Activity Type Enum"""

from enum import Enum


class ActivityTypeEnum(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    STATEMENT_UPLOAD = "statement_upload"
    INVESTMENT_PLAN_GENERATION = "investment_plan_generation"
    AI_CHAT = "ai_chat"
    PROFILE_UPDATE = "profile_update"
