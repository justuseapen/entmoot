# frozen_string_literal: true

require "sidekiq/api"

class HealthController < ApplicationController
  # GET /health
  # Returns detailed health status of all services.
  # Returns 200 if all services are healthy, 503 if any service is unhealthy.
  def show
    checks = {
      database: check_database,
      redis: check_redis,
      sidekiq: check_sidekiq
    }

    all_healthy = checks.values.all? { |check| check[:healthy] }

    # Debug CORS - log Origin header received by Rails
    origin_header = request.headers["Origin"]
    cors_origins = ENV.fetch("CORS_ORIGINS", "not set")
    Rails.logger.info "[CORS DEBUG] Origin header: #{origin_header.inspect}, CORS_ORIGINS env: #{cors_origins}"

    response = {
      status: all_healthy ? "ok" : "degraded",
      timestamp: Time.current.iso8601,
      environment: Rails.env,
      version: ENV.fetch("APP_VERSION", "unknown"),
      checks: checks,
      debug: {
        origin_received: origin_header,
        cors_origins_configured: cors_origins
      }
    }

    render json: response, status: all_healthy ? :ok : :service_unavailable
  end

  private

  def check_database
    ActiveRecord::Base.connection.execute("SELECT 1")
    { healthy: true, message: "Connected" }
  rescue StandardError => e
    { healthy: false, message: e.message }
  end

  def check_redis
    redis_url = ENV.fetch("REDIS_URL", "redis://localhost:6379/0")
    redis = Redis.new(url: redis_url)
    result = redis.ping
    redis.close

    if result == "PONG"
      { healthy: true, message: "Connected" }
    else
      { healthy: false, message: "Unexpected response: #{result}" }
    end
  rescue StandardError => e
    { healthy: false, message: e.message }
  end

  def check_sidekiq
    processes = Sidekiq::ProcessSet.new.size
    if processes.positive?
      { healthy: true, message: "#{processes} process(es) running" }
    else
      { healthy: false, message: "No processes running" }
    end
  rescue StandardError => e
    { healthy: false, message: e.message }
  end
end
