"""
WealthWise AI - Global Exception Handlers

Registered on the FastAPI app in main.py.
Converts all domain/framework exceptions into consistent JSON error responses.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.logger import logger
from app.exceptions.custom_exceptions import WealthWiseException


def _error_response(
    status_code: int,
    message: str,
    errors: list | None = None,
    request_id: str = "",
) -> JSONResponse:
    """Standardized error response envelope."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": None,
            "errors": errors,
            "meta": {"request_id": request_id},
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI app."""

    @app.exception_handler(WealthWiseException)
    async def handle_domain_exception(
        request: Request, exc: WealthWiseException
    ) -> JSONResponse:
        """Handles all custom domain exceptions."""
        request_id = getattr(request.state, "request_id", "")
        logger.warning(
            f"Domain exception: {exc.message}",
            extra={"request_id": request_id, "status_code": exc.status_code},
        )
        errors = [str(exc.details)] if exc.details else None
        return _error_response(exc.status_code, exc.message, errors, request_id)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handles Pydantic validation errors — returns field-level details."""
        request_id = getattr(request.state, "request_id", "")
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"])
            errors.append(f"{field}: {error['msg']}")

        logger.info(
            "Validation error",
            extra={"request_id": request_id, "errors": errors},
        )
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Request validation failed",
            errors,
            request_id,
        )

    @app.exception_handler(SQLAlchemyError)
    async def handle_database_error(
        request: Request, exc: SQLAlchemyError
    ) -> JSONResponse:
        """Handles SQLAlchemy database errors — logs full stack, returns safe message."""
        request_id = getattr(request.state, "request_id", "")
        logger.exception(
            "Database error",
            extra={"request_id": request_id},
        )
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "A database error occurred. Our team has been notified.",
            request_id=request_id,
        )

    @app.exception_handler(Exception)
    async def handle_unhandled_exception(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Catch-all handler — prevents stack trace leakage in production."""
        request_id = getattr(request.state, "request_id", "")
        logger.critical(
            f"Unhandled exception: {type(exc).__name__}",
            extra={"request_id": request_id},
            exc_info=exc,
        )
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"An unexpected error occurred. Reference ID: {request_id}",
            request_id=request_id,
        )
