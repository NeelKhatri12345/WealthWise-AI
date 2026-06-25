"""
WealthWise AI - Structured Hourly-Rotating Logger

Architecture:
- TimedRotatingFileHandler rotates every hour (when="h")
- Retains 720 files = 30 days of hourly logs
- Separate handlers: app.log (INFO+), error.log (ERROR+), access.log
- JSON formatter for machine-readable output (ELK / CloudWatch compatible)
- Console handler with color output for development
- LoggerAdapter for per-request context injection (request_id, user_id)
"""

import json
import logging
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
import sys
from typing import Any, MutableMapping

# Ensure logs directory exists
LOG_DIR = Path("app/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)


class JSONFormatter(logging.Formatter):
    """
    Formats log records as single-line JSON objects.
    Compatible with structured log aggregators (ELK, Datadog, CloudWatch).
    Sensitive fields (password, token, secret) are automatically masked.
    """

    SENSITIVE_FIELDS = {"password", "token", "secret", "api_key", "authorization"}

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "process": record.process,
            "thread": record.thread,
        }

        # Inject request context if available
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = record.duration_ms

        # Include extra fields from record (mask sensitive ones)
        for key, val in record.__dict__.items():
            if key in self.SENSITIVE_FIELDS:
                log_entry[key] = "***REDACTED***"
            elif key not in {
                "name",
                "msg",
                "args",
                "levelname",
                "levelno",
                "pathname",
                "filename",
                "module",
                "exc_info",
                "exc_text",
                "stack_info",
                "lineno",
                "funcName",
                "created",
                "msecs",
                "relativeCreated",
                "thread",
                "threadName",
                "processName",
                "process",
                "message",
                "request_id",
                "user_id",
                "method",
                "path",
                "status_code",
                "duration_ms",
            }:
                pass  # Only log explicitly added extras to avoid noise

        # Exception info
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str, ensure_ascii=False)


class ColorConsoleFormatter(logging.Formatter):
    """ANSI-colored formatter for development console output."""

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        prefix = f"{color}[{record.levelname}]{self.RESET}"
        request_id = getattr(record, "request_id", "")
        rid = f" [{request_id[:8]}]" if request_id else ""
        return f"{prefix}{rid} {record.name}: {record.getMessage()}"


def _build_rotating_handler(
    filename: str,
    level: int,
) -> TimedRotatingFileHandler:
    """Creates an hourly-rotating file handler with JSON formatting."""
    handler = TimedRotatingFileHandler(
        filename=str(LOG_DIR / filename),
        when="h",  # Rotate every hour
        interval=1,
        backupCount=720,  # 30 days × 24 hours/day
        encoding="utf-8",
        delay=False,
    )
    handler.setLevel(level)
    handler.setFormatter(JSONFormatter())
    handler.namer = lambda name: name.replace(".log", "") + ".log"
    return handler


def setup_logger(name: str = "wealthwise") -> logging.Logger:
    """
    Configures and returns the application logger.

    Handlers:
    - app.log     → INFO and above, hourly rotation
    - error.log   → ERROR and above, hourly rotation
    - stdout      → DEBUG and above (dev only, colored)
    """
    logger = logging.getLogger(name)

    # Prevent duplicate handlers if called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    # Application log (INFO+)
    logger.addHandler(_build_rotating_handler("app.log", logging.INFO))

    # Error log (ERROR+)
    logger.addHandler(_build_rotating_handler("error.log", logging.ERROR))

    # Console (development)
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.DEBUG)
    console.setFormatter(ColorConsoleFormatter())
    logger.addHandler(console)

    return logger


class RequestContextAdapter(logging.LoggerAdapter):
    """
    Logger adapter that automatically injects request context
    (request_id, user_id, method, path) into every log record.

    Usage:
        adapted = get_request_logger(request_id="abc", user_id="xyz")
        adapted.info("Processing statement upload")
    """

    def process(
        self, msg: str, kwargs: MutableMapping[str, Any]
    ) -> tuple[str, MutableMapping[str, Any]]:
        kwargs.setdefault("extra", {}).update(self.extra)
        return msg, kwargs


def get_request_logger(
    request_id: str = "",
    user_id: str = "",
    method: str = "",
    path: str = "",
) -> RequestContextAdapter:
    """Returns a context-enriched logger adapter for a single request."""
    return RequestContextAdapter(
        logger,
        extra={
            "request_id": request_id,
            "user_id": user_id,
            "method": method,
            "path": path,
        },
    )


# Module-level logger — used throughout the application
logger = setup_logger("wealthwise")
