"""
WealthWise AI - Application Configuration

Uses Pydantic BaseSettings to load and validate environment variables.
All settings are sourced from .env file or environment variables.
The singleton is cached via @lru_cache for performance.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration for WealthWise AI.
    Groups: Application, Database, JWT, Redis, Gemini, S3, Rate Limiting, CORS.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────
    APP_NAME: str = "WealthWise AI"
    APP_ENV: str = Field(
        default="development", pattern="^(development|staging|production)$"
    )
    APP_PORT: int = 8000
    APP_DEBUG: bool = False
    SECRET_KEY: str  # Required — no default

    # ── Database ───────────────────────────────────────────────────
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "wealthwise_db"
    POSTGRES_USER: str = "wealthwise_user"
    POSTGRES_PASSWORD: str  # Required

    # Assembled from components if DATABASE_URL not explicitly provided
    DATABASE_URL: str = ""
    DB_ECHO: bool = False  # Enable SQL query logging (dev only)

    @model_validator(mode="after")
    def assemble_database_url(self) -> "Settings":
        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        return self

    # ── Redis ──────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT ────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str  # Required
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Gemini ─────────────────────────────────────────────────────
    GEMINI_API_KEY: str  # Required
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_MAX_TOKENS: int = 8192
    GEMINI_TEMPERATURE: float = 0.7

    # ── AWS / MinIO Storage ────────────────────────────────────────
    S3_ENDPOINT_URL: str = ""  # Empty = use real AWS, set for MinIO
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = "wealthwise-statements"
    S3_REGION: str = "us-east-1"

    # ── Rate Limiting ──────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_AI_REQUESTS: int = 10  # Separate limit for AI endpoints

    # ── File Upload ────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: List[str] = ["application/pdf", "text/csv"]

    # ── CORS ───────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "wealthwise.ai"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def parse_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns the cached Settings singleton.
    Called once at startup; subsequent calls return cached instance.
    """
    return Settings()
