from uuid import UUID

from app.core.security import hash_password, verify_password
from app.exceptions.custom_exceptions import NotFoundException, UnauthorizedException
from app.repositories.user_repository import UserRepository
from app.repositories.statement_repository import StatementRepository
from app.clients.s3_client import S3Client
from app.schemas.user_schema import UserResponse, UserUpdate


class UserService:

    def __init__(
        self,
        user_repo: UserRepository,
        statement_repo: StatementRepository,
        s3_client: S3Client,
    ) -> None:
        self._user_repo = user_repo
        self._statement_repo = statement_repo
        self._s3 = s3_client

    async def delete_user(self, user_id: UUID) -> None:
        """Permanently delete user profile and all associated files/data."""
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        # 1. Fetch statements and delete files from S3/MinIO
        statements = await self._statement_repo.get_by_user(user_id, limit=1000)
        for stmt in statements:
            try:
                await self._s3.delete_file(stmt.file_path)
            except Exception as exc:
                # Log but continue to delete other files and user
                from app.core.logger import logger
                logger.error(
                    f"Failed to delete statement file from S3: {stmt.file_path}",
                    exc_info=exc,
                )

        # 2. Hard delete the user (cascades database rows)
        await self._user_repo.delete(user)

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
