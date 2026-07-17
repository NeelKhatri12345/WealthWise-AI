"""
WealthWise AI - Application Configuration

Uses Pydantic BaseSettings to load and validate environment variables.
All settings are sourced from .env file or environment variables.
The singleton is cached via @lru_cache for performance.
"""

from functools import lru_cache
import os
from pathlib import Path
from typing import List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration for WealthWise AI.
    Groups: Application, Database, JWT, Redis, Gemini, S3, Rate Limiting, CORS, OCR.
    """

    model_config = SettingsConfigDict(
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
    ALLOWED_FILE_TYPES: List[str] | str = [
        "application/pdf",
        "image/png",
        "image/jpeg",
    ]

    @field_validator("ALLOWED_FILE_TYPES", mode="before")
    @classmethod
    def parse_file_types(cls, v):
        if isinstance(v, str):
            return [ft.strip() for ft in v.split(",")]
        return v

    # ── CORS ───────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] | str = ["http://localhost:3000", "http://localhost:5173"]
    ALLOWED_HOSTS: List[str] | str = ["localhost", "127.0.0.1", "wealthwise.ai"]

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

    # ── OCR (legacy manual/admin endpoints only — NOT the active pipeline) ──
    # The active statement-processing pipeline uses Docling directly
    # (app/extraction/docling_extractor.py) and does not read any setting
    # in this block. These settings only affect the legacy EasyOCR-based
    # manual endpoints (POST /statements/{id}/processing/run-ocr etc.).
    # Which OCR engine to use.  Routed by OCRFactory.
    # Supported: "easyocr" | "paddleocr" | "aws_textract" | "azure_ocr"
    OCR_PROVIDER: str = "easyocr"

    # Comma-separated EasyOCR language codes (e.g. "en" or "en,hi").
    # Only the active provider reads this; other providers may ignore it.
    OCR_LANGUAGE: str = "en"

    # Enable CUDA GPU acceleration for EasyOCR / PaddleOCR.
    # Set to False in CPU-only or containerised environments.
    OCR_GPU: bool = False

    # Minimum confidence score [0.0, 1.0] for a text block to be kept.
    # Blocks below this threshold are discarded before building OCRResult.
    OCR_CONFIDENCE_THRESHOLD: float = Field(default=0.5, ge=0.0, le=1.0)

    # ── AI Provider (Financial Profile Chatbot) ────────────────────
    # Controls which AI backend the financial profile chatbot uses.
    # "disabled" (default) → deterministic rule-based question flow; no API key required.
    # "openai"             → uses OPENAI_API_KEY + AI_MODEL_NAME
    # "gemini"             → uses existing GEMINI_API_KEY + AI_MODEL_NAME
    AI_PROVIDER: str = Field(default="disabled", pattern="^(disabled|openai|gemini)$")
    OPENAI_API_KEY: str = ""       # Only read when AI_PROVIDER=openai
    AI_MODEL_NAME: str = ""        # Override model name; provider uses its own default if empty
    AI_REQUEST_TIMEOUT_SECONDS: int = 60  # Max seconds to wait for AI provider response


    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


def _resolve_env_file() -> str | None:
    """Determine which .env file to load.

    Resolution order:
    1. ENV_FILE env-var (explicit override for CI / custom setups)
    2. .env.test  — if it exists in the backend root (test runs)
    3. .env       — default production / local development file
    4. None       — rely solely on real environment variables
    """
    override = os.environ.get("ENV_FILE")
    if override:
        return override

    backend_root = Path(__file__).resolve().parent.parent.parent
    for candidate in (".env", ".env.test"):
        path = backend_root / candidate
        if path.is_file():
            return str(path)

    return None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns the cached Settings singleton.
    Called once at startup; subsequent calls return cached instance.
    """
    env_file = _resolve_env_file()
    return Settings(_env_file=env_file)
