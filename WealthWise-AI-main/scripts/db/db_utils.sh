#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# WealthWise AI — Database Utilities Script
# Usage:
#   ./scripts/db/db_utils.sh migrate          # Run pending migrations
#   ./scripts/db/db_utils.sh rollback         # Rollback one migration
#   ./scripts/db/db_utils.sh seed             # Seed default data
#   ./scripts/db/db_utils.sh reset            # Drop + recreate + migrate + seed (dev only)
#   ./scripts/db/db_utils.sh backup           # Create pg_dump backup
#   ./scripts/db/db_utils.sh restore <file>   # Restore from backup file
#   ./scripts/db/db_utils.sh status           # Show current migration status
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

COMMAND="${1:-help}"
BACKUP_DIR="./scripts/db/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[DB]${NC} $1"; }
log_success() { echo -e "${GREEN}[DB]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Load env vars from backend .env
if [ -f ./backend/.env ]; then
    source ./backend/.env
else
    log_warn "No .env file found at ./backend/.env — using system environment"
fi

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGDATABASE="${POSTGRES_DB:-wealthwise_db}"
PGUSER="${POSTGRES_USER:-wealthwise_user}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

run_in_backend() {
    cd ./backend && python -m "$@"
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_migrate() {
    log_info "Running database migrations..."
    cd ./backend
    alembic upgrade head
    log_success "Migrations applied successfully"
    alembic current
}

cmd_rollback() {
    local steps="${2:-1}"
    log_warn "Rolling back $steps migration(s)..."
    cd ./backend
    alembic downgrade "-$steps"
    log_success "Rollback complete"
    alembic current
}

cmd_seed() {
    log_info "Seeding database with default data..."
    cd ./backend
    python -m app.database.seed
    log_success "Database seeded successfully"
}

cmd_reset() {
    log_warn "⚠️  This will DROP and recreate the database!"
    read -p "Are you sure? (type 'yes' to confirm): " -r confirmation
    if [ "$confirmation" != "yes" ]; then
        log_info "Reset cancelled"
        exit 0
    fi
    
    log_info "Resetting database..."
    
    # Drop and recreate
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -c "DROP DATABASE IF EXISTS $PGDATABASE;" postgres
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -c "CREATE DATABASE $PGDATABASE;" postgres
    
    # Re-run migrations
    cmd_migrate
    
    # Seed
    cmd_seed
    
    log_success "Database reset complete"
}

cmd_backup() {
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="${BACKUP_DIR}/wealthwise_backup_${TIMESTAMP}.sql.gz"
    
    log_info "Creating database backup: $BACKUP_FILE"
    
    pg_dump \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        --no-password \
        --format=custom \
        --compress=9 \
    | gzip > "$BACKUP_FILE"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
}

cmd_restore() {
    local backup_file="${2:-}"
    
    if [ -z "$backup_file" ]; then
        log_error "Usage: ./scripts/db/db_utils.sh restore <backup_file>"
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
    fi
    
    log_warn "⚠️  This will OVERWRITE the current database!"
    read -p "Restore from $backup_file? (type 'yes'): " -r confirmation
    if [ "$confirmation" != "yes" ]; then
        exit 0
    fi
    
    log_info "Restoring database from $backup_file..."
    
    gunzip -c "$backup_file" | pg_restore \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        --clean \
        --no-owner \
        --no-privileges
    
    log_success "Database restored successfully"
}

cmd_status() {
    log_info "Current migration status:"
    cd ./backend
    alembic current
    echo ""
    log_info "Migration history:"
    alembic history --verbose
}

cmd_help() {
    echo ""
    echo "WealthWise AI — Database Utility Script"
    echo ""
    echo "Usage: ./scripts/db/db_utils.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  migrate           Run all pending migrations"
    echo "  rollback [N]      Roll back N migrations (default: 1)"
    echo "  seed              Seed database with default roles and admin user"
    echo "  reset             ⚠️  Drop and recreate database (dev only)"
    echo "  backup            Create a compressed pg_dump backup"
    echo "  restore <file>    Restore from a backup file"
    echo "  status            Show current Alembic migration status"
    echo "  help              Show this help message"
    echo ""
}

# ── Router ────────────────────────────────────────────────────────────────────
case "$COMMAND" in
    migrate)  cmd_migrate ;;
    rollback) cmd_rollback "$@" ;;
    seed)     cmd_seed ;;
    reset)    cmd_reset ;;
    backup)   cmd_backup ;;
    restore)  cmd_restore "$@" ;;
    status)   cmd_status ;;
    help|*)   cmd_help ;;
esac
