# syntax = docker/dockerfile:1

# Multi-stage Dockerfile for Entmoot (Rails backend + React frontend)
# This builds a single image containing both the API and the frontend assets

# Global ARGs (must be declared before first FROM that uses them)
ARG RUBY_VERSION=3.4.4

# =============================================================================
# Stage 1: Frontend Build
# =============================================================================
FROM node:22-alpine AS frontend-build

WORKDIR /frontend

# Install dependencies first (better caching)
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./

# Build arguments for Vite
ARG VITE_APP_VERSION=unknown
ARG VITE_SENTRY_DSN=
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npm run build

# =============================================================================
# Stage 2: Ruby Base
# =============================================================================
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /rails

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development"

# =============================================================================
# Stage 3: Backend Build
# =============================================================================
FROM base AS backend-build

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install application gems
COPY backend/Gemfile backend/Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Copy backend application code
COPY backend/ .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# =============================================================================
# Stage 4: Final Image
# =============================================================================
FROM base

# Copy built artifacts: gems, application
COPY --from=backend-build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=backend-build /rails /rails

# Copy frontend build to Rails public directory
# This allows Rails to serve the frontend with RAILS_SERVE_STATIC_FILES=true
COPY --from=frontend-build /frontend/dist /rails/public

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    mkdir -p db log storage tmp && \
    chown -R rails:rails db log storage tmp public
USER 1000:1000

# Entrypoint prepares the database
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default
EXPOSE 3000
CMD ["./bin/rails", "server"]
