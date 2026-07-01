#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# WealthWise AI — Production Deployment Script
# Usage: ./scripts/deploy/deploy.sh [staging|production]
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
ENVIRONMENT="${1:-staging}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="wealthwise-api"
APP_DIR="/opt/wealthwise"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Functions ─────────────────────────────────────────────────────────────────
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

check_prerequisites() {
    log_info "Checking prerequisites..."
    command -v docker >/dev/null 2>&1 || log_error "Docker is not installed"
    command -v aws >/dev/null 2>&1 || log_error "AWS CLI is not installed"
    command -v curl >/dev/null 2>&1 || log_error "curl is not installed"
    log_success "Prerequisites check passed"
}

get_api_health() {
    local url="$1"
    local max_attempts=10
    local attempt=1
    
    log_info "Waiting for health check at $url..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        log_info "Attempt $attempt/$max_attempts — not ready yet, waiting 5s..."
        sleep 5
        attempt=$((attempt + 1))
    done
    log_error "Health check failed after $max_attempts attempts"
}

# ── Main Deployment Logic ─────────────────────────────────────────────────────
main() {
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "WealthWise AI Deployment — Environment: $ENVIRONMENT"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    check_prerequisites
    
    # 1. Get ECR login
    log_info "Step 1/6: Authenticating with ECR..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$ECR_REGISTRY"
    log_success "ECR authentication successful"
    
    # 2. Pull latest image
    IMAGE_TAG="${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"
    log_info "Step 2/6: Pulling latest image: $IMAGE_TAG"
    docker pull "$IMAGE_TAG"
    log_success "Image pulled successfully"
    
    # 3. Run database migrations
    log_info "Step 3/6: Running database migrations..."
    docker run --rm \
        --env-file "$APP_DIR/.env" \
        --network host \
        "$IMAGE_TAG" \
        alembic upgrade head
    log_success "Migrations applied successfully"
    
    # 4. Update service
    log_info "Step 4/6: Deploying new container..."
    cd "$APP_DIR"
    docker compose -f "$COMPOSE_FILE" pull api
    docker compose -f "$COMPOSE_FILE" up -d api --force-recreate --no-deps
    log_success "Container restarted"
    
    # 5. Health check
    log_info "Step 5/6: Running health checks..."
    if [ "$ENVIRONMENT" == "production" ]; then
        HEALTH_URL="https://api.wealthwise.ai/health"
    else
        HEALTH_URL="https://staging.wealthwise.ai/health"
    fi
    get_api_health "$HEALTH_URL"
    
    # 6. Cleanup old images
    log_info "Step 6/6: Cleaning up old Docker images..."
    docker image prune -f
    log_success "Cleanup complete"
    
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "✅ Deployment to $ENVIRONMENT completed successfully!"
    log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"
