"""WealthWise AI - Statement Processing Status Enum

Full lifecycle for a bank statement through the processing pipeline.

State machine
─────────────
UPLOADED ──► PROCESSING ──► OCR_COMPLETED ──► PARSING ──► COMPLETED
    │                │                │             │
    └────────────────┴────────────────┴─────────────┴──► FAILED

UPLOADED      File is stored in MinIO. No processing has started.
PROCESSING    Worker has picked up the job; file is being read / decoded.
OCR_COMPLETED OCR engine has extracted raw text from the document.
              (OCR result is stored in processing_metadata column.)
PARSING       Raw OCR text is being parsed into structured transactions.
COMPLETED     All transactions persisted; downstream analytics triggered.
FAILED        Unrecoverable error at any stage; see error_message column.

Backward-compatible: the original PENDING value is kept as an alias for
UPLOADED so that existing rows and code that still use PENDING continue
to work without any data migration.
"""

from enum import Enum


class StatementStatusEnum(str, Enum):
    # ── Upload stage ──────────────────────────────────────────────────────────
    PENDING = "pending"  # Legacy alias — treated identically to UPLOADED
    UPLOADED = "uploaded"  # File stored in MinIO, queued for processing

    # ── Processing stages ─────────────────────────────────────────────────────
    PROCESSING = "PROCESSING"  # Worker active; file is being decoded
    OCR_COMPLETED = "ocr_completed"  # Raw text extracted by OCR engine
    PARSING = "parsing"  # Structured data being extracted from raw text

    # ── Terminal stages ───────────────────────────────────────────────────────
    COMPLETED = "COMPLETED"  # Pipeline finished; transactions persisted
    FAILED = "FAILED"  # Unrecoverable error; see error_message

    # ── Convenience helpers ───────────────────────────────────────────────────
    @classmethod
    def normalize(cls, status: "StatementStatusEnum") -> "StatementStatusEnum":
        """Map legacy PENDING to UPLOADED for lifecycle comparisons."""
        if status == cls.PENDING:
            return cls.UPLOADED
        return status

    @classmethod
    def queued_statuses(cls) -> frozenset["StatementStatusEnum"]:
        """Statuses that represent work not yet started."""
        return frozenset({cls.PENDING, cls.UPLOADED})

    @classmethod
    def in_progress_statuses(cls) -> frozenset["StatementStatusEnum"]:
        """Statuses that mean a worker is currently active."""
        return frozenset({cls.PROCESSING, cls.OCR_COMPLETED, cls.PARSING})

    @classmethod
    def terminal_statuses(cls) -> frozenset["StatementStatusEnum"]:
        """Statuses from which no further forward transitions are valid."""
        return frozenset({cls.COMPLETED, cls.FAILED})

    @classmethod
    def can_transition(
        cls,
        current: "StatementStatusEnum",
        target: "StatementStatusEnum",
    ) -> bool:
        """Return True if ``current → target`` is a valid lifecycle step."""
        if target == cls.FAILED:
            return current not in cls.terminal_statuses()

        normalized = cls.normalize(current)
        allowed = _STATUS_TRANSITIONS.get(normalized, frozenset())
        return target in allowed

    def is_queued(self) -> bool:
        return self in self.queued_statuses()

    def is_in_progress(self) -> bool:
        return self in self.in_progress_statuses()

    def is_terminal(self) -> bool:
        return self in self.terminal_statuses()


# Valid forward transitions (FAILED is handled separately in can_transition).
_STATUS_TRANSITIONS: dict[StatementStatusEnum, frozenset[StatementStatusEnum]] = {
    StatementStatusEnum.PENDING: frozenset(
        {StatementStatusEnum.PROCESSING, StatementStatusEnum.FAILED}
    ),
    StatementStatusEnum.UPLOADED: frozenset(
        {StatementStatusEnum.PROCESSING, StatementStatusEnum.FAILED}
    ),
    StatementStatusEnum.PROCESSING: frozenset(
        {StatementStatusEnum.OCR_COMPLETED, StatementStatusEnum.FAILED}
    ),
    StatementStatusEnum.OCR_COMPLETED: frozenset(
        {StatementStatusEnum.PARSING, StatementStatusEnum.FAILED}
    ),
    StatementStatusEnum.PARSING: frozenset(
        {StatementStatusEnum.COMPLETED, StatementStatusEnum.FAILED}
    ),
    StatementStatusEnum.COMPLETED: frozenset(),
    StatementStatusEnum.FAILED: frozenset(),
}
