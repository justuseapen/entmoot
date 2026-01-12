#!/bin/bash
set -e

# Entmoot Production Deployment Script
# Usage: ./deploy.sh [command]
# Commands:
#   setup     - First-time setup (build, migrate, seed)
#   deploy    - Pull latest, rebuild, and restart
#   logs      - View all service logs
#   status    - Check service status
#   restart   - Restart all services
#   stop      - Stop all services
#   shell     - Open Rails console
#   migrate   - Run database migrations
#   seed      - Run database seeds

COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="entmoot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env() {
    if [ ! -f ".env" ]; then
        log_error ".env file not found!"
        log_info "Copy .env.production.example to .env and configure it:"
        log_info "  cp .env.production.example .env"
        exit 1
    fi
}

build_frontend() {
    log_info "Building frontend..."
    cd frontend
    npm ci
    npm run build
    cd ..
    log_info "Frontend built successfully!"
}

case "${1:-deploy}" in
    setup)
        log_info "Starting first-time setup..."
        check_env

        # Build frontend
        build_frontend

        # Build and start services
        log_info "Building Docker images..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME build

        log_info "Starting services..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d

        # Wait for services to be healthy
        log_info "Waiting for services to be healthy..."
        sleep 10

        # Run migrations
        log_info "Running database migrations..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec web bundle exec rails db:prepare

        # Seed database
        log_info "Seeding database..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec web bundle exec rails db:seed

        log_info "Setup complete!"
        log_info "Your app should be available at https://\$DOMAIN"
        ;;

    deploy)
        log_info "Starting deployment..."
        check_env

        # Pull latest code
        log_info "Pulling latest code..."
        git pull

        # Build frontend
        build_frontend

        # Rebuild and restart services
        log_info "Rebuilding Docker images..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME build

        # Run migrations before restarting
        log_info "Running database migrations..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec web bundle exec rails db:migrate || true

        # Restart with zero-downtime (rolling update)
        log_info "Restarting services..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d --no-deps web sidekiq

        log_info "Deployment complete!"
        ;;

    logs)
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f ${2:-}
        ;;

    status)
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
        ;;

    restart)
        log_info "Restarting services..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
        log_info "Services restarted!"
        ;;

    stop)
        log_info "Stopping services..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down
        log_info "Services stopped!"
        ;;

    shell)
        log_info "Opening Rails console..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec web bundle exec rails console
        ;;

    migrate)
        log_info "Running database migrations..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec web bundle exec rails db:migrate
        log_info "Migrations complete!"
        ;;

    seed)
        log_info "Seeding database..."
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME exec web bundle exec rails db:seed
        log_info "Seeding complete!"
        ;;

    *)
        echo "Entmoot Deployment Script"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup     - First-time setup (build, migrate, seed)"
        echo "  deploy    - Pull latest, rebuild, and restart (default)"
        echo "  logs      - View all service logs (add service name for specific logs)"
        echo "  status    - Check service status"
        echo "  restart   - Restart all services"
        echo "  stop      - Stop all services"
        echo "  shell     - Open Rails console"
        echo "  migrate   - Run database migrations"
        echo "  seed      - Run database seeds"
        ;;
esac
