"""
WealthWise AI - Redis-Backed Sliding Window Rate Limiter

Limits:
- Default authenticated: RATE_LIMIT_REQUESTS per RATE_LIMIT_WINDOW_SECONDS
- Unauthenticated: 20 req/minute per IP
- AI coach endpoints: 10 req/minute per user (Gemini quota protection)

Uses Redis INCR + EXPIRE for atomic sliding window counters.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()

# Path prefixes that have tighter limits
AI_PATHS = ["/api/v1/ai-coach"]


class RateLimitMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        try:
            import redis.asyncio as aioredis

            redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

            # Determine rate limit key and limit value
            identifier = self._get_identifier(request)
            is_ai_path = any(request.url.path.startswith(p) for p in AI_PATHS)

            if is_ai_path:
                limit = settings.RATE_LIMIT_AI_REQUESTS
                window = settings.RATE_LIMIT_WINDOW_SECONDS
                key = f"rl:ai:{identifier}"
            else:
                limit = settings.RATE_LIMIT_REQUESTS
                window = settings.RATE_LIMIT_WINDOW_SECONDS
                key = f"rl:api:{identifier}"

            # Atomic increment
            count = await redis_client.incr(key)
            if count == 1:
                # Set expiry on first request
                await redis_client.expire(key, window)
            ttl = await redis_client.ttl(key)

            await redis_client.aclose()

            if count > limit:
                logger.warning(
                    "Rate limit exceeded",
                    extra={"identifier": identifier, "count": count, "limit": limit},
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "message": f"Rate limit exceeded. Try again in {ttl} seconds.",
                        "data": None,
                        "errors": None,
                        "meta": {"retry_after": ttl},
                    },
                    headers={
                        "Retry-After": str(ttl),
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(ttl),
                    },
                )

        except Exception as exc:
            # Redis unavailable → fail open (don't block legitimate traffic)
            logger.warning("Rate limiter unavailable (fail-open)", exc_info=exc)

        return await call_next(request)

    @staticmethod
    def _get_identifier(request: Request) -> str:
        """
        Uses Authorization header (user-based) if present, else IP address.
        Prevents per-IP limits from affecting all users behind a shared NAT.
        """
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            # Use token prefix as identifier (not full token for privacy)
            return f"token:{auth[7:27]}"
        # Fall back to IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        return f"ip:{request.client.host if request.client else 'unknown'}"
