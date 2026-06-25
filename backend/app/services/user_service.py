"""WealthWise AI - User Service"""

from uuid import UUID

from app.core.security import hash_password, verify_password
from app.exceptions.custom_exceptions import NotFoundException, UnauthorizedException
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserResponse, UserUpdate


class UserService:

    def __init__(self, user_repo: UserRepository) -> None:
        self._user_repo = user_repo

    async def get_profile(self, user_id: UUID) -> UserResponse:
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return UserResponse.from_orm_with_role(user)

    async def update_profile(self, user_id: UUID, data: UserUpdate) -> UserResponse:
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        updated = await self._user_repo.update(user, data.model_dump(exclude_none=True))
        return UserResponse.from_orm_with_role(updated)

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
    ) -> None:
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")
        await self._user_repo.update(
            user, {"hashed_password": hash_password(new_password)}
        )
