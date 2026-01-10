# Backend AGENTS.md

## Overview
Rails 7.2 API-mode application for the Entmoot family planning platform.

## Quick Commands
```bash
# Start Docker services (PostgreSQL + Redis)
docker-compose up -d

# Create databases
bundle exec rails db:create

# Run migrations
bundle exec rails db:migrate

# Run tests
bundle exec rspec

# Run linting
bundle exec rubocop

# Auto-fix linting issues
bundle exec rubocop -A

# Start Rails server
bundle exec rails s -p 3000

# Start Sidekiq worker
bundle exec sidekiq
```

## Project Structure
- `app/controllers/` - API controllers
- `app/models/` - ActiveRecord models
- `app/jobs/` - Sidekiq background jobs
- `app/mailers/` - ActionMailer email classes
- `config/` - Rails configuration
- `spec/` - RSpec tests
  - `spec/requests/` - Request/integration specs
  - `spec/models/` - Model specs
  - `spec/factories/` - FactoryBot factories
  - `spec/support/` - Test helpers

## Code Style
- All Ruby files must start with `# frozen_string_literal: true`
- Use double quotes for strings
- Rubocop config in `.rubocop.yml`

## Testing
- RSpec with FactoryBot, Faker, and Shoulda Matchers
- Run specific test: `bundle exec rspec spec/requests/health_spec.rb`
- Run with documentation format: `bundle exec rspec --format documentation`

## API Namespacing
- All API routes under `/api/v1/`
- Health check available at `/health`

## Dependencies
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)
- Sidekiq for background jobs
- Devise + devise-jwt for authentication (not yet configured)
- Pundit for authorization (not yet configured)
