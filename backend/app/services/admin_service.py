"""WealthWise AI - Admin Service"""

from uuid import UUID

from app.exceptions.custom_exceptions import NotFoundException
from app.repositories.statement_repository import StatementRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserResponse


class AdminService:

    def __init__(
        self,
        user_repo: UserRepository,
        statement_repo: StatementRepository,
    ) -> None:
        self._user_repo = user_repo
        self._statement_repo = statement_repo

    async def get_all_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role_filter: str | None = None,
        is_active: bool | None = None,
    ) -> list[UserResponse]:
        users = await self._user_repo.get_all_users(skip, limit, role_filter, is_active)
        return [UserResponse.from_orm_with_role(u) for u in users]

    async def get_user_detail(self, user_id: UUID) -> UserResponse:
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return UserResponse.from_orm_with_role(user)

    async def toggle_user_status(self, user_id: UUID) -> UserResponse:
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        if user.is_active:
            updated = await self._user_repo.deactivate(user)
        else:
            updated = await self._user_repo.activate(user)
        return UserResponse.from_orm_with_role(updated)

    async def get_system_stats(self) -> dict:
        total_users = await self._user_repo.count()
        total_statements = await self._statement_repo.count()
        pending_statements = len(await self._statement_repo.get_pending())
        return {
            "total_users": total_users,
            "total_statements": total_statements,
            "pending_statements": pending_statements,
        }
