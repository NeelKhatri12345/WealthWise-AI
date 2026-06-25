"""
WealthWise AI - Production FastAPI Application Entry Point

Responsibilities:
- Creates the FastAPI application instance via factory
- Registers middleware stack (order-sensitive)
- Registers global exception handlers
- Mounts versioned API router
- Manages application lifespan (startup/shutdown hooks)
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.logger import logger
from app.database.session import engine
from app.exceptions.handlers import register_exception_handlers
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # ── Startup ──────────────────────────────────────────────────
    logger.info("Starting WealthWise AI API", extra={"env": settings.APP_ENV})

    # Verify database connectivity
    try:
        from sqlalchemy import text

        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified")
    except Exception as exc:
        logger.critical("Database connection failed on startup", exc_info=exc)
        raise

    # Load ML models into app state
    try:
        from pathlib import Path
        import pickle

        models_dir = Path("app/ml_models")
        if models_dir.exists():
            model_files = {
                "risk_profile_model": "risk_profile_model.pkl",
                "risk_label_encoder": "risk_label_encoder.pkl",
            }
            app.state.ml_models = {}
            for model_key, model_file in model_files.items():
                model_path = models_dir / model_file
                if model_path.exists():
                    with open(model_path, "rb") as f:
                        app.state.ml_models[model_key] = pickle.load(f)
                    logger.info(f"Loaded ML model: {model_key}")
        else:
            app.state.ml_models = {}
            logger.warning(
                "ML models directory not found — analytics will be unavailable"
            )
    except Exception as exc:
        logger.error("Failed to load ML models", exc_info=exc)
        app.state.ml_models = {}

    logger.info(
        "WealthWise AI started successfully",
        extra={"host": "0.0.0.0", "port": settings.APP_PORT},
    )

    yield

    # ── Shutdown ──────────────────────────────────────────────────
    logger.info("Shutting down WealthWise AI API...")
    await engine.dispose()
    logger.info("Database connections closed. Goodbye.")


def create_app() -> FastAPI:
    """
    Application factory — creates and configures the FastAPI instance.
    """
    app = FastAPI(
        title="WealthWise AI API",
        description=(
            "Production-grade AI-powered personal finance platform. "
            "Accepts bank statements, performs OCR extraction, "
            "computes financial health scores, risk profiles, "
            "portfolio recommendations, and AI coaching."
        ),
        version="1.0.0",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
        openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
        lifespan=lifespan,
    )

    # ── Middleware (registered in reverse execution order) ────────
    # TrustedHost — prevent host header injection attacks
    if settings.APP_ENV == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS,
        )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID", "X-Process-Time"],
    )

    # Rate Limiting (Redis-backed)
    app.add_middleware(RateLimitMiddleware)

    # Request/Response Logging (outermost — runs first on request)
    app.add_middleware(LoggingMiddleware)

    # ── Exception Handlers ────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────
    app.include_router(api_v1_router, prefix="/api/v1")

    # ── Static Files ──────────────────────────────────────────────
    app.mount("/static", StaticFiles(directory="app/static"), name="static")

    # ── Health endpoint (no auth required) ───────────────────────
    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": "1.0.0",
            "env": settings.APP_ENV,
        }

    return app


# Application instance (used by uvicorn / gunicorn)
app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development",
        loop="uvloop",
        http="httptools",
        log_config=None,  # Use our custom logger instead
    )
