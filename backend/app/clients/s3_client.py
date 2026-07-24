"""
WealthWise AI - S3 / MinIO Client

Async file storage using aioboto3.
Compatible with both AWS S3 and MinIO (local dev) via endpoint_url.
"""

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()


class S3Client:

    def __init__(self, _settings=None) -> None:
        cfg = _settings or settings
        self._bucket = cfg.S3_BUCKET_NAME
        self._region = cfg.S3_REGION
        self._session_kwargs = {
            "aws_access_key_id": cfg.S3_ACCESS_KEY_ID,
            "aws_secret_access_key": cfg.S3_SECRET_ACCESS_KEY,
            "region_name": cfg.S3_REGION,
        }
        # If endpoint_url is set, use MinIO; otherwise use real AWS S3
        self._endpoint_url = cfg.S3_ENDPOINT_URL or None

    def _get_client(self):
        """Returns an aioboto3 S3 client context manager."""
        try:
            import aioboto3
        except ImportError:
            raise RuntimeError("aioboto3 not installed. Run: pip install aioboto3")
        session = aioboto3.Session()
        kwargs = dict(self._session_kwargs)
        if self._endpoint_url:
            kwargs["endpoint_url"] = self._endpoint_url
        return session.client("s3", **kwargs)

    async def upload_file(
        self,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload bytes to S3/MinIO.

        Args:
            key: S3 object key (path within bucket)
            data: File content as bytes
            content_type: MIME type

        Returns:
            Full S3 URL of the uploaded object
        """
        async with self._get_client() as s3:
            put_kwargs = {
                "Bucket": self._bucket,
                "Key": key,
                "Body": data,
                "ContentType": content_type,
            }
            # Only enable SSE if we are communicating with real AWS S3 (no custom endpoint)
            if not self._endpoint_url:
                put_kwargs["ServerSideEncryption"] = "AES256"

            await s3.put_object(**put_kwargs)
        logger.info("S3 upload", extra={"key": key, "size_bytes": len(data)})
        return key

    async def download_file(self, key: str) -> bytes:
        """Download a file from S3/MinIO and return raw bytes."""
        async with self._get_client() as s3:
            response = await s3.get_object(Bucket=self._bucket, Key=key)
            return await response["Body"].read()

    async def delete_file(self, key: str) -> bool:
        """Delete an object from S3/MinIO."""
        try:
            async with self._get_client() as s3:
                await s3.delete_object(Bucket=self._bucket, Key=key)
            logger.info("S3 delete", extra={"key": key})
            return True
        except Exception as exc:
            logger.error("S3 delete failed", extra={"key": key}, exc_info=exc)
            return False

    async def generate_presigned_url(
        self,
        key: str,
        expires_seconds: int = 3600,
    ) -> str:
        """
        Generate a temporary pre-signed URL for secure client-side download.
        Useful for allowing users to download their own statements.
        """
        async with self._get_client() as s3:
            url = await s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires_seconds,
            )
        return url

    async def ensure_bucket_exists(self) -> None:
        """Creates the bucket if it doesn't exist (MinIO dev setup)."""
        async with self._get_client() as s3:
            try:
                await s3.head_bucket(Bucket=self._bucket)
            except Exception:
                await s3.create_bucket(Bucket=self._bucket)
                logger.info(f"Created S3 bucket: {self._bucket}")

    async def health_check(self) -> bool:
        """Returns True if the bucket is reachable (MinIO / S3)."""
        async with self._get_client() as s3:
            await s3.head_bucket(Bucket=self._bucket)
        return True
