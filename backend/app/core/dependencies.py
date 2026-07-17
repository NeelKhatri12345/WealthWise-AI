"""
WealthWise AI - FastAPI Dependency Injection Providers

All reusable FastAPI dependencies are defined here.
Imported by route handlers via Depends().

Providers:
- get_db()                  → yields AsyncSession
- get_current_user()        → decodes JWT, returns User model
- get_current_active_user() → get_current_user + checks is_active
- get_admin_user()          → shorthand for ADMIN role
- get_*_repository()        → repository instances
- get_*_service()           → service instances (with injected repos)
"""

from functools import lru_cache
from typing import AsyncGenerator
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logger import logger
from app.database.session import AsyncSessionLocal
from app.enums.role_enum import RoleEnum
from app.exceptions.custom_exceptions import ForbiddenException, UnauthorizedException

settings = get_settings()
http_bearer = HTTPBearer(auto_error=False)


# ── Database Session ──────────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields an async database session.
    Commits on success, rolls back on exception, always closes.

    Usage:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Authentication Dependencies ───────────────────────────────────────────────


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: AsyncSession = Depends(get_db),
):
    """
    Decodes the Bearer JWT and returns the corresponding User ORM instance.

    Raises:
        UnauthorizedException: Token missing, invalid, expired, or blacklisted
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException("Authentication credentials not provided")

    from app.core.security import decode_token
    from app.repositories.user_repository import UserRepository

    token_payload = decode_token(credentials.credentials)

    # Check JWT blacklist (Redis)
    await _check_token_blacklist(token_payload.jti)

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(token_payload.sub))
    if not user:
        raise UnauthorizedException("User not found")

    return user


async def get_current_active_user(
    current_user=Depends(get_current_user),
):
    """
    Extends get_current_user with an is_active check.

    Raises:
        ForbiddenException: User account is deactivated
    """
    if not current_user.is_active:
        raise ForbiddenException("User account is deactivated")
    return current_user


async def get_admin_user(
    current_user=Depends(get_current_active_user),
):
    """Shorthand dependency requiring ADMIN role."""
    if current_user.role.name != RoleEnum.ADMIN.value:
        raise ForbiddenException("Admin access required")
    return current_user


# ── Repository Dependencies ───────────────────────────────────────────────────


def get_user_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository

    return UserRepository(db)


def get_statement_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.statement_repository import StatementRepository

    return StatementRepository(db)


def get_transaction_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.transaction_repository import TransactionRepository

    return TransactionRepository(db)


def get_analytics_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.analytics_repository import AnalyticsRepository

    return AnalyticsRepository(db)


# ── Service Dependencies ──────────────────────────────────────────────────────


def get_auth_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository
    from app.services.auth_service import AuthService

    return AuthService(user_repo=UserRepository(db))


def get_user_service(db: AsyncSession = Depends(get_db)):
    from app.clients.s3_client import S3Client
    from app.repositories.statement_repository import StatementRepository
    from app.repositories.user_repository import UserRepository
    from app.services.user_service import UserService

    return UserService(
        user_repo=UserRepository(db),
        statement_repo=StatementRepository(db),
        s3_client=S3Client(settings),
    )


def get_statement_service(db: AsyncSession = Depends(get_db)):
    from app.clients.s3_client import S3Client
    from app.repositories.statement_repository import StatementRepository
    from app.services.statement_service import StatementService

    return StatementService(
        statement_repo=StatementRepository(db),
        s3_client=S3Client(settings),
    )

def get_financial_metrics_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.financial_metrics_service import FinancialMetricsService

    return FinancialMetricsService(transaction_repo=TransactionRepository(db))


def get_health_score_service():
    from app.services.health_recommendations import HealthScoreRecommendationsGenerator
    from app.services.health_score_service import HealthScoreService

    return HealthScoreService(
        recommendations_gen=HealthScoreRecommendationsGenerator()
    )


def get_analytics_service(
    db: AsyncSession = Depends(get_db),
    metrics_service=Depends(get_financial_metrics_service),
    health_score_service=Depends(get_health_score_service),
):
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.services.analytics_service import AnalyticsService

    return AnalyticsService(
        analytics_repo=AnalyticsRepository(db),
        metrics_service=metrics_service,
        health_score_service=health_score_service,
    )


def get_portfolio_service(db: AsyncSession = Depends(get_db)):
    from app.clients.gemini_client import GeminiClient
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.services.portfolio_service import PortfolioService

    return PortfolioService(
        analytics_repo=AnalyticsRepository(db),
        gemini_client=GeminiClient(settings),
    )


def get_ai_coach_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.ai_coach_repository import AICoachRepository
    from app.services.financial_context_builder import FinancialContextBuilder
    from app.services.ai_prompt_builder import AIPromptBuilder
    from app.services.ai_provider_service import AIProviderService
    from app.services.ai_coach_service import AICoachService
    from app.repositories.transaction_repository import TransactionRepository
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.repositories.financial_profile_repository import FinancialProfileRepository
    from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
    from app.services.financial_metrics_service import FinancialMetricsService

    txn_repo = TransactionRepository(db)
    metrics_service = FinancialMetricsService(transaction_repo=txn_repo)
    context_builder = FinancialContextBuilder(
        transaction_repo=txn_repo,
        analytics_repo=AnalyticsRepository(db),
        profile_repo=FinancialProfileRepository(db),
        snapshot_repo=HealthScoreSnapshotRepository(db),
        metrics_service=metrics_service,
    )
    return AICoachService(
        ai_coach_repo=AICoachRepository(db),
        context_builder=context_builder,
        prompt_builder=AIPromptBuilder(),
        provider_service=AIProviderService(),
    )



def get_admin_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.statement_repository import StatementRepository
    from app.repositories.user_repository import UserRepository
    from app.services.admin_service import AdminService

    return AdminService(
        user_repo=UserRepository(db),
        statement_repo=StatementRepository(db),
    )


def get_dashboard_service(
    db: AsyncSession = Depends(get_db),
    metrics_service=Depends(get_financial_metrics_service),
    health_score_service=Depends(get_health_score_service),
):
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.repositories.transaction_repository import TransactionRepository
    from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
    from app.repositories.financial_profile_repository import FinancialProfileRepository
    from app.services.dashboard_service import DashboardService

    return DashboardService(
        transaction_repo=TransactionRepository(db),
        analytics_repo=AnalyticsRepository(db),
        metrics_service=metrics_service,
        health_score_service=health_score_service,
        snapshot_repo=HealthScoreSnapshotRepository(db),
        profile_repo=FinancialProfileRepository(db),
    )


def get_transaction_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.transaction_service import TransactionService

    return TransactionService(transaction_repo=TransactionRepository(db))


# ── Financial Profile & Chat Dependencies ─────────────────────────────────────


def get_financial_profile_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.financial_profile_repository import FinancialProfileRepository

    return FinancialProfileRepository(db)


def get_ai_coach_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.ai_coach_repository import AICoachRepository

    return AICoachRepository(db)


def get_financial_chat_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.financial_chat_repository import FinancialChatRepository

    return FinancialChatRepository(db)


def get_financial_analysis_service(db: AsyncSession = Depends(get_db)):
    """Provides a FinancialAnalysisService scoped to the current DB session."""
    from app.repositories.statement_repository import StatementRepository
    from app.services.financial_analysis_service import FinancialAnalysisService

    return FinancialAnalysisService(statement_repo=StatementRepository(db))


def get_health_score_snapshot_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository

    return HealthScoreSnapshotRepository(db)


def get_financial_profile_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.financial_profile_repository import FinancialProfileRepository
    from app.services.financial_profile_service import FinancialProfileService

    return FinancialProfileService(profile_repo=FinancialProfileRepository(db))


def get_financial_chat_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.financial_chat_repository import FinancialChatRepository
    from app.repositories.financial_profile_repository import FinancialProfileRepository
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.financial_chat_service import FinancialChatService
    from app.services.financial_profile_service import FinancialProfileService

    return FinancialChatService(
        chat_repo=FinancialChatRepository(db),
        transaction_repo=TransactionRepository(db),
        profile_service=FinancialProfileService(profile_repo=FinancialProfileRepository(db)),
    )


def get_hybrid_health_score_service(
    db: AsyncSession = Depends(get_db),
    health_score_service=Depends(get_health_score_service),
):
    from app.repositories.financial_profile_repository import FinancialProfileRepository
    from app.repositories.health_score_snapshot_repository import HealthScoreSnapshotRepository
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.financial_metrics_service import FinancialMetricsService
    from app.services.hybrid_health_score_service import HybridHealthScoreService

    txn_repo = TransactionRepository(db)
    return HybridHealthScoreService(
        transaction_repo=txn_repo,
        profile_repo=FinancialProfileRepository(db),
        snapshot_repo=HealthScoreSnapshotRepository(db),
        metrics_service=FinancialMetricsService(transaction_repo=txn_repo),
        health_score_service=health_score_service,
    )


# ── OCR Dependencies ──────────────────────────────────────────────────────────


@lru_cache(maxsize=1)
def _ocr_provider_singleton():
    """
    Process-level singleton for the OCR provider.

    EasyOCR's Reader loads model weights on first initialisation, which can
    take several seconds.  Caching ensures this cost is paid once at startup
    (or on first OCR call) and not repeated for every HTTP request.

    lru_cache on a module-level function is the idiomatic Python singleton
    pattern that survives FastAPI's dependency scope model without requiring
    a global variable.
    """
    from app.ocr.factory import OCRFactory

    return OCRFactory.create(settings)


def get_ocr_provider():
    """
    Returns the cached singleton OCRProvider for the configured engine.

    Delegates to _ocr_provider_singleton() so the provider is shared across
    all requests in the process lifetime.

    Usage in a route or service:
        from app.core.dependencies import get_ocr_provider
        from app.ocr.base import OCRProvider

        def my_service(ocr: OCRProvider = Depends(get_ocr_provider)):
            ...
    """
    return _ocr_provider_singleton()


def get_statement_processing_service(
    db: AsyncSession = Depends(get_db),
):
    from app.repositories.statement_repository import StatementRepository
    from app.services.statement_processing_service import StatementProcessingService

    return StatementProcessingService(
        statement_repo=StatementRepository(db),
        ocr_provider=get_ocr_provider(),
    )


def get_ocr_orchestration_service(db: AsyncSession = Depends(get_db)):
    """
    Constructs OCROrchestrationService with all required collaborators.

    Wires together:
      - StatementRepository    — raw statement access
      - StatementProcessingService — pipeline state transitions
      - S3Client               — MinIO file download
      - OCRProvider            — text extraction (via factory)

    Usage in a route or worker:
        from app.core.dependencies import get_ocr_orchestration_service
        from app.services.ocr_orchestration_service import OCROrchestrationService

        async def my_worker(
            ocr_svc: OCROrchestrationService = Depends(get_ocr_orchestration_service)
        ):
            await ocr_svc.run_ocr(statement_id)
    """
    from app.clients.s3_client import S3Client
    from app.repositories.statement_repository import StatementRepository
    from app.services.ocr_orchestration_service import OCROrchestrationService
    from app.services.statement_processing_service import StatementProcessingService

    statement_repo = StatementRepository(db)
    processing_service = StatementProcessingService(
        statement_repo=statement_repo,
        ocr_provider=get_ocr_provider(),
    )

    return OCROrchestrationService(
        statement_repo=statement_repo,
        processing_service=processing_service,
        s3_client=S3Client(settings),
        ocr_provider=get_ocr_provider(),
    )


# ── Document Extraction Dependencies (active pipeline: Docling only) ────────


def get_document_extractor():
    """
    Returns the DoclingExtractor — the only document extraction engine in
    the active statement processing pipeline. Not an OCRProvider: Docling
    parses PDF structure directly, with OCR explicitly disabled.
    """
    from app.extraction.docling_extractor import DoclingExtractor

    return DoclingExtractor()


def get_document_extraction_service(db: AsyncSession = Depends(get_db)):
    """
    Constructs DocumentExtractionService with all required collaborators.

    Wires together:
      - StatementRepository       — raw statement access
      - StatementProcessingService — pipeline state transitions
      - S3Client                  — MinIO file download
      - DocumentExtractor         — Docling structured extraction

    Usage in a route or worker:
        from app.core.dependencies import get_document_extraction_service
        from app.services.document_extraction_service import DocumentExtractionService

        async def my_worker(
            extraction_svc: DocumentExtractionService = Depends(get_document_extraction_service)
        ):
            await extraction_svc.run_extraction(statement_id)
    """
    from app.clients.s3_client import S3Client
    from app.repositories.statement_repository import StatementRepository
    from app.services.document_extraction_service import DocumentExtractionService
    from app.services.statement_processing_service import StatementProcessingService

    statement_repo = StatementRepository(db)
    processing_service = StatementProcessingService(statement_repo=statement_repo)

    return DocumentExtractionService(
        statement_repo=statement_repo,
        processing_service=processing_service,
        s3_client=S3Client(settings),
        extractor=get_document_extractor(),
    )


# ── Transaction Parser Dependencies ──────────────────────────────────────────


def get_transaction_parser():
    """
    Returns the TransactionParser implementation used by the active
    pipeline: DoclingTransactionMapper — a direct field mapping from
    Docling's structured table JSON to ParsedTransaction (no regex, no OCR
    cleanup). RegexTransactionParser remains importable for legacy/manual
    use but is never returned here.
    """
    from app.parsers.docling_mapper import DoclingTransactionMapper

    return DoclingTransactionMapper()


def get_transaction_parser_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.statement_repository import StatementRepository
    from app.repositories.transaction_repository import TransactionRepository
    from app.services.statement_processing_service import StatementProcessingService
    from app.services.transaction_parser_service import TransactionParserService

    statement_repo = StatementRepository(db)
    processing_service = StatementProcessingService(statement_repo=statement_repo)

    return TransactionParserService(
        statement_repo=statement_repo,
        transaction_repo=TransactionRepository(db),
        processing_service=processing_service,
        parser=get_transaction_parser(),
    )


# ── Portfolio Holding Dependencies ───────────────────────────────────────────


def get_portfolio_holding_repository(db: AsyncSession = Depends(get_db)):
    from app.repositories.portfolio_holding_repository import (
        PortfolioHoldingRepository,
    )

    return PortfolioHoldingRepository(db)


def get_portfolio_holding_service(db: AsyncSession = Depends(get_db)):
    from app.repositories.portfolio_holding_repository import (
        PortfolioHoldingRepository,
    )
    from app.services.portfolio_holding_service import PortfolioHoldingService

    return PortfolioHoldingService(holding_repo=PortfolioHoldingRepository(db))


# ── Internal Helpers ──────────────────────────────────────────────────────────


async def _check_token_blacklist(jti: str) -> None:
    """
    Checks Redis for blacklisted JWT (logout / token revocation).
    If Redis is unavailable, logs a warning and allows the request (fail-open).
    """
    try:
        import redis.asyncio as aioredis

        client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        from app.core.constants import REDIS_BLACKLIST_PREFIX

        is_blacklisted = await client.exists(f"{REDIS_BLACKLIST_PREFIX}{jti}")
        await client.aclose()
        if is_blacklisted:
            raise UnauthorizedException("Token has been revoked")
    except UnauthorizedException:
        raise
    except Exception as exc:
        logger.warning(
            "Redis blacklist check failed (fail-open)", extra={"error": str(exc)}
        )
