"""
WealthWise AI - Custom Exception Classes

Domain-specific exceptions that carry HTTP status codes.
Raised in services and caught by global exception handlers in handlers.py.
"""

from typing import Any, Optional


class WealthWiseException(Exception):
    """
    Base exception for all WealthWise domain errors.
    Carries an HTTP status code and a user-facing message.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class NotFoundException(WealthWiseException):
    """Resource not found (404)."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class UnauthorizedException(WealthWiseException):
    """Authentication failure — invalid or missing credentials (401)."""

    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message, status_code=401)


class ForbiddenException(WealthWiseException):
    """Authorization failure — insufficient permissions (403)."""

    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message, status_code=403)


class ConflictException(WealthWiseException):
    """Conflict with existing resource (409). E.g., duplicate email."""

    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(message, status_code=409)


class ValidationException(WealthWiseException):
    """Business rule validation failure (422)."""

    def __init__(self, message: str = "Validation failed", details: Any = None) -> None:
        super().__init__(message, status_code=422, details=details)


class FileTooLargeException(WealthWiseException):
    """Uploaded file exceeds maximum allowed size (413)."""

    def __init__(self, message: str = "File too large") -> None:
        super().__init__(message, status_code=413)


class UnsupportedFileTypeException(WealthWiseException):
    """Uploaded file type is not supported (415)."""

    def __init__(self, message: str = "Unsupported file type") -> None:
        super().__init__(message, status_code=415)


class RateLimitException(WealthWiseException):
    """Too many requests (429)."""

    def __init__(
        self, message: str = "Rate limit exceeded. Please try again later."
    ) -> None:
        super().__init__(message, status_code=429)


class ServiceUnavailableException(WealthWiseException):
    """External service (Gemini, S3, etc.) is temporarily unavailable (503)."""

    def __init__(self, message: str = "Service temporarily unavailable") -> None:
        super().__init__(message, status_code=503)
