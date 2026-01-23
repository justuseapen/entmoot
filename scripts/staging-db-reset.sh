#!/bin/bash
set -e

# Staging Database Reset Script for Entmoot
# Usage: ./scripts/staging-db-reset.sh [--yes]
#
# This script resets the staging database to a clean state with demo data.
# WARNING: This destroys ALL staging data!
#
# Options:
#   --yes    Skip confirmation prompt

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration
COMPOSE_FILE="docker-compose.staging.yml"
PROJECT_NAME="entmoot-staging"

# Parse arguments
SKIP_CONFIRM=""
if [ "$1" = "--yes" ] || [ "$1" = "-y" ]; then
    SKIP_CONFIRM="true"
fi

echo -e "${RED}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                      ⚠️  WARNING ⚠️                             ║"
echo "║                                                               ║"
echo "║  This will DESTROY all data in the staging database!         ║"
echo "║  This action cannot be undone.                                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ -z "$SKIP_CONFIRM" ]; then
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Cancelled."
        exit 0
    fi
fi

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Compose file not found: $COMPOSE_FILE"
    log_info "Make sure you're running this from the project root directory."
    exit 1
fi

# Step 1: Stop web and sidekiq services
log_step "Stopping web and sidekiq services..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop web_staging sidekiq_staging 2>/dev/null || true

# Step 2: Check if postgres container is running
log_step "Checking PostgreSQL container..."
if ! docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps postgres_staging | grep -q "running"; then
    log_info "Starting PostgreSQL container..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d postgres_staging
    log_info "Waiting for PostgreSQL to be ready..."
    sleep 10
fi

# Step 3: Get database credentials from environment or use defaults
DB_USER="${POSTGRES_USER:-entmoot_staging}"
DB_NAME="${POSTGRES_DB:-entmoot_staging}"

# Step 4: Drop and recreate database
log_step "Dropping existing database..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T postgres_staging \
    psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres || true

log_step "Creating fresh database..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T postgres_staging \
    psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" postgres

# Step 5: Run migrations
log_step "Running database migrations..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" run --rm web_staging \
    bundle exec rails db:migrate

# Step 6: Seed demo data
log_step "Seeding demo data..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" run --rm web_staging \
    bundle exec rails db:seed

# Step 7: Restart services
log_step "Restarting web and sidekiq services..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d web_staging sidekiq_staging

# Step 8: Wait for services to be healthy
log_step "Waiting for services to be healthy..."
sleep 15

# Step 9: Health check
log_step "Running health check..."
HEALTH_URL="${STAGING_URL:-https://staging.entmoot.app}/health"

for i in {1..5}; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        log_info "Health check passed!"
        break
    fi
    if [ $i -eq 5 ]; then
        log_warn "Health check did not pass. Check logs with: docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs web_staging"
    else
        log_info "Attempt $i/5: Waiting for service to be ready..."
        sleep 5
    fi
done

echo ""
log_info "Staging database reset complete!"
echo ""
echo -e "  Demo credentials:"
echo -e "    Email:    ${BLUE}demo@entmoot.app${NC}"
echo -e "    Password: ${BLUE}(check db/seeds.rb for password)${NC}"
echo ""
echo -e "  Staging URL: ${BLUE}${STAGING_URL:-https://staging.entmoot.app}${NC}"
