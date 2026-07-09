"""WealthWise AI - V1 API Router Aggregator"""

from fastapi import APIRouter

from app.api.v1.admin_routes import router as admin_router
from app.api.v1.ai_coach_routes import router as ai_coach_router
from app.api.v1.auth_routes import router as auth_router
from app.api.v1.dashboard_routes import router as dashboard_router
from app.api.v1.health_score_routes import router as health_score_router
from app.api.v1.portfolio_holding_routes import router as portfolio_holding_router
from app.api.v1.portfolio_routes import router as portfolio_router
from app.api.v1.risk_profile_routes import router as risk_profile_router
from app.api.v1.statement_routes import router as statement_router
from app.api.v1.transaction_routes import router as transaction_router
from app.api.v1.user_routes import router as user_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(user_router, prefix="/users", tags=["Users"])
api_v1_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_v1_router.include_router(
    statement_router, prefix="/statements", tags=["Statements"]
)
api_v1_router.include_router(
    transaction_router, prefix="/transactions", tags=["Transactions"]
)
api_v1_router.include_router(
    health_score_router, prefix="/health-score", tags=["Health Score"]
)
api_v1_router.include_router(
    risk_profile_router, prefix="/risk-profile", tags=["Risk Profile"]
)
api_v1_router.include_router(portfolio_router, prefix="/portfolio", tags=["Portfolio"])
api_v1_router.include_router(
    portfolio_holding_router, prefix="/portfolio", tags=["Portfolio Holdings"]
)
api_v1_router.include_router(ai_coach_router, prefix="/ai-coach", tags=["AI Coach"])
api_v1_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
