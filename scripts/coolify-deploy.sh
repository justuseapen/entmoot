#!/bin/bash
set -e

# Coolify Deployment Script for Entmoot
# Usage: ./scripts/coolify-deploy.sh [--force]
#
# Setup:
# 1. Get your Coolify API token from: https://your-coolify-url/security/api-tokens
# 2. Get your app UUID from Coolify dashboard (in app settings)
# 3. Set environment variables:
#    export COOLIFY_URL="https://your-coolify-instance.com"
#    export COOLIFY_TOKEN="your-api-token"
#    export COOLIFY_APP_UUID="your-app-uuid"
#
# Or create a .env.coolify file in the project root with these values.

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

# Load env from .env.coolify if it exists
if [ -f ".env.coolify" ]; then
    log_info "Loading configuration from .env.coolify"
    export $(grep -v '^#' .env.coolify | xargs)
fi

# Validate required environment variables
if [ -z "$COOLIFY_URL" ]; then
    log_error "COOLIFY_URL is not set"
    echo "Set it with: export COOLIFY_URL=\"https://your-coolify-instance.com\""
    exit 1
fi

if [ -z "$COOLIFY_TOKEN" ]; then
    log_error "COOLIFY_TOKEN is not set"
    echo "Get a token from: $COOLIFY_URL/security/api-tokens"
    echo "Then set it with: export COOLIFY_TOKEN=\"your-token\""
    exit 1
fi

if [ -z "$COOLIFY_APP_UUID" ]; then
    log_error "COOLIFY_APP_UUID is not set"
    echo "Find your app UUID in the Coolify dashboard (app settings)"
    echo "Then set it with: export COOLIFY_APP_UUID=\"your-uuid\""
    exit 1
fi

# Parse arguments
FORCE=""
if [ "$1" = "--force" ]; then
    FORCE="&force=true"
    log_warn "Force rebuild enabled (no cache)"
fi

# Step 1: Push to GitHub
log_step "Pushing latest changes to GitHub..."
git push origin master 2>/dev/null || log_warn "Already up to date or push failed"

# Step 2: Trigger Coolify deployment
log_step "Triggering Coolify deployment..."
RESPONSE=$(curl -s -X GET \
    "$COOLIFY_URL/api/v1/deploy?uuid=$COOLIFY_APP_UUID$FORCE" \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json")

# Check response
if echo "$RESPONSE" | grep -q "deployment_uuid"; then
    DEPLOYMENT_UUID=$(echo "$RESPONSE" | grep -o '"deployment_uuid":"[^"]*"' | cut -d'"' -f4)
    log_info "Deployment triggered successfully!"
    echo ""
    echo -e "  Deployment UUID: ${BLUE}$DEPLOYMENT_UUID${NC}"
    echo -e "  Monitor at: ${BLUE}$COOLIFY_URL${NC}"
    echo ""
    log_info "Deployment is running in the background."
    log_info "Check Coolify dashboard for build progress and logs."
else
    log_error "Deployment failed!"
    echo "$RESPONSE"
    exit 1
fi
