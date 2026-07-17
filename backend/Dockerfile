# ──────────────────────────────────────────────────────────────────────────────
# WealthWise AI — Multi-Stage Production Dockerfile
# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 (builder): installs all Python packages
# Stage 2 (runtime): minimal image with only runtime dependencies
# Runs as non-root user 'wealthwise' for security

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /build

# Install build-time system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies to /install prefix
COPY requirements.txt .
RUN pip install --default-timeout=300 --no-cache-dir --upgrade pip==24.3.1 \
    && pip install --default-timeout=300 --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM python:3.13-slim AS runtime

WORKDIR /app

# Install minimal runtime system libraries
# poppler-utils removed: it was only required by pdf2image (PDF page
# rasterization for the legacy EasyOCR path), which is no longer part of
# the active pipeline. Docling reads PDFs directly — no rasterization.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Create non-root user and group
RUN groupadd -r wealthwise && useradd -r -g wealthwise -s /sbin/nologin wealthwise

# Copy application source (chown to wealthwise)
COPY --chown=wealthwise:wealthwise . .

# Create required directories with correct ownership
# /app/.cache/huggingface is the writable cache for Docling/HuggingFace model
# downloads. HF_HOME is set below so that snapshot_download() never tries to
# write to ~/. (which does not exist for a system user created with useradd -r).
RUN mkdir -p app/logs app/static app/ml_models .cache/huggingface \
    && chown -R wealthwise:wealthwise app/logs app/static app/ml_models .cache

# Tell HuggingFace (and Docling, which uses hf_hub internally) to store all
# downloaded models under /app/.cache/huggingface so the non-root wealthwise
# user always has write access.  TRANSFORMERS_CACHE is the legacy alias kept
# for compatibility with older transformers/tokenizers versions.
ENV HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface \
    HF_HUB_CACHE=/app/.cache/huggingface

# Switch to non-root user
USER wealthwise

# Expose API port
EXPOSE 8000

# Health check — verifies the application is responding
HEALTHCHECK \
    --interval=30s \
    --timeout=10s \
    --start-period=15s \
    --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production startup command
# - uvloop: faster event loop
# - httptools: faster HTTP parsing
# - 4 workers: suitable for a 4-core container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--loop", "uvloop", "--http", "httptools", "--no-access-log"]