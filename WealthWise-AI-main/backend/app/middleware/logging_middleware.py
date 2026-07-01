"""
WealthWise AI - Request/Response Logging Middleware

Assigns a unique request_id to every request.
Logs: method, path, status_code, duration_ms, user_agent, IP.
Adds X-Request-ID and X-Process-Time response headers.
"""

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import get_request_logger


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        # Assign unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        log = get_request_logger(
            request_id=request_id,
            method=request.method,
            path=str(request.url.path),
        )

        start_time = time.perf_counter()

        log.info(
            "Request started",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query),
                "client_ip": self._get_client_ip(request),
                "user_agent": request.headers.get("user-agent", ""),
            },
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            log.error(
                "Request failed with unhandled exception",
                extra={"duration_ms": duration_ms},
                exc_info=exc,
            )
            raise

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        log.info(
            "Request completed",
            extra={
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )

        # Inject tracing headers into response
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms}ms"

        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Extracts real client IP, respecting X-Forwarded-For (Nginx proxy)."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
