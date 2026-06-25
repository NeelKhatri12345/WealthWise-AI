"""WealthWise AI - Statement Processing Status Enum"""

from enum import Enum


class StatementStatusEnum(str, Enum):
    """
    Lifecycle states for a bank statement upload.
    Transitions: PENDING → PROCESSING → COMPLETED | FAILED
    """

    PENDING = "pending"  # Uploaded to S3, not yet processed
    PROCESSING = "processing"  # OCR + ML pipeline running
    COMPLETED = "completed"  # All analytics generated successfully
    FAILED = "failed"  # Pipeline error — see error_message column
