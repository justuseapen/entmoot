#!/bin/bash
set -e

# Staging Rollback Script for Entmoot
# Usage: ./scripts/rollback-staging.sh <version>
#
# This script rolls back the staging environment to a previous version.
#
# Arguments:
#   version    Git SHA, tag name (e.g., deploy-20240115-143022), or image tag
#
# Examples:
#   ./scripts/rollback-staging.sh abc123def              # Rollback to specific commit
#   ./scripts/rollback-staging.sh deploy-20240115-143022 # Rollback to deployment tag
#   ./scripts/rollback-staging.sh staging                # Rollback to current staging tag

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
REGISTRY="ghcr.io"
# Set GITHUB_REPOSITORY in your environment or .env.coolify
IMAGE_NAME="${REGISTRY}/${GITHUB_REPOSITORY:-your-org/entmoot}/backend"
STAGING_URL="${STAGING_URL:-https://staging.entmoot.app}"

# Parse arguments
VERSION="${1:-}"

if [ -z "$VERSION" ]; then
    echo -e "${YELLOW}Usage: $0 <version>${NC}"
    echo ""
    echo "Arguments:"
    echo "  version    Git SHA, tag name, or image tag to rollback to"
    echo ""
    echo "Recent deployment tags:"
    git tag -l 'deploy-*' --sort=-creatordate 2>/dev/null | head -10 || echo "  (no deployment tags found)"
    echo ""
    echo "Recent commits:"
    git log --oneline -10 2>/dev/null || echo "  (git log not available)"
    exit 1
fi

log_info "Rolling back staging to version: $VERSION"
echo ""

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Compose file not found: $COMPOSE_FILE"
    log_info "Make sure you're running this from the project root directory."
    exit 1
fi

# Check if GITHUB_REPOSITORY is set
if [ -z "$GITHUB_REPOSITORY" ]; then
    log_warn "GITHUB_REPOSITORY not set. Using placeholder 'your-org/entmoot'."
    log_info "Set it with: export GITHUB_REPOSITORY=\"your-org/entmoot\""
fi

# Step 1: Pull the specific version from registry
log_step "Pulling image: ${IMAGE_NAME}:${VERSION}"

if ! docker pull "${IMAGE_NAME}:${VERSION}" 2>/dev/null; then
    log_error "Failed to pull image: ${IMAGE_NAME}:${VERSION}"
    echo ""
    echo "Make sure the image exists in the registry."
    echo "You can list available tags with:"
    echo "  docker images ${IMAGE_NAME}"
    exit 1
fi

# Step 2: Tag it as staging
log_step "Tagging image as staging..."
docker tag "${IMAGE_NAME}:${VERSION}" "${IMAGE_NAME}:staging"

# Step 3: Stop current services
log_step "Stopping current services..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop web_staging sidekiq_staging 2>/dev/null || true

# Step 4: Start services with new image
log_step "Starting services with rolled back image..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --no-deps web_staging sidekiq_staging

# Step 5: Wait for services to start
log_step "Waiting for services to start..."
sleep 15

# Step 6: Health check
log_step "Running health check..."

HEALTHY="false"
for i in {1..10}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" "${STAGING_URL}/health" 2>/dev/null || echo "CURL_FAILED")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        log_info "Health check passed!"
        HEALTHY="true"
        break
    fi

    log_info "Attempt $i/10: Waiting for service to be healthy (HTTP $HTTP_CODE)..."
    sleep 5
done

echo ""
if [ "$HEALTHY" = "true" ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   Rollback Successful!                        ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Rolled back to: ${BLUE}$VERSION${NC}"
    echo -e "  Staging URL:    ${BLUE}$STAGING_URL${NC}"
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                   Rollback May Have Failed                    ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log_warn "Health check did not pass within the expected time."
    echo ""
    echo "Check the logs with:"
    echo "  docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs web_staging"
    echo "  docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs sidekiq_staging"
    exit 1
fi
