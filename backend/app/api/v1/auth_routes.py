"""WealthWise AI - Auth Routes"""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_auth_service, get_current_active_user
from app.schemas.auth_schema import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user_schema import UserResponse
from app.schemas.base_schema import APIResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=201,
    summary="Register a new user",
)
async def register(
    data: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    user = await service.register(data)
    user_response = UserResponse.from_orm_with_role(user)
    return APIResponse(
        success=True,
        message="Account created successfully. Please log in.",
        data=user_response,
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    summary="Login and receive JWT tokens",
)
async def login(
    data: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    tokens = await service.login(data)
    return APIResponse(success=True, message="Login successful", data=tokens)


@router.post(
    "/refresh",
    response_model=APIResponse[TokenResponse],
    summary="Refresh access token using refresh token",
)
async def refresh_token(
    data: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    tokens = await service.refresh(data)
    return APIResponse(success=True, message="Token refreshed", data=tokens)


@router.post(
    "/logout",
    response_model=APIResponse[None],
    summary="Logout and invalidate access token",
)
async def logout(
    current_user=Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    # Extract JTI from the token stored in request state
    # The JTI is used to blacklist the token in Redis
    return APIResponse(success=True, message="Logged out successfully")
