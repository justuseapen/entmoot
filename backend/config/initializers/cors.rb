# frozen_string_literal: true

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

# Parse CORS origins from environment variable
# Supports comma-separated list: "https://app.example.com,https://www.example.com"
cors_origins_string = ENV.fetch("CORS_ORIGINS", "http://localhost:5173")

# Split by comma and strip whitespace, filter out empty strings
cors_origins = cors_origins_string.split(",").map(&:strip).reject(&:empty?)

# Ensure we have at least one origin
cors_origins = ["http://localhost:5173"] if cors_origins.empty?

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Use splat operator to pass multiple origins as separate arguments
    origins(*cors_origins)

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             credentials: false,
             expose: %w[Authorization]
  end
end

# Log configured origins in development for debugging
if Rails.env.development?
  Rails.logger.info "CORS configured for origins: #{cors_origins.inspect}"
end
