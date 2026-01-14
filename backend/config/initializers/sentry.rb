# frozen_string_literal: true

# Sentry configuration for Glitchtip error tracking
# Docs: https://docs.sentry.io/platforms/ruby/guides/rails/
# Glitchtip is Sentry-compatible: https://glitchtip.com/documentation

Sentry.init do |config|
  # DSN from Glitchtip project settings
  config.dsn = ENV.fetch("SENTRY_DSN", nil)

  # Set environment
  config.environment = Rails.env

  # Breadcrumbs for debugging context
  config.breadcrumbs_logger = %i[active_support_logger http_logger]

  # Sample rate for error events (1.0 = 100%)
  config.sample_rate = 1.0

  # Performance monitoring sample rate (optional)
  # Set to 0.0 to disable, or 0.1-1.0 for sampling
  config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", "0.1").to_f

  # Send PII data (user info) - disabled by default for privacy
  config.send_default_pii = ENV.fetch("SENTRY_SEND_PII", "false") == "true"

  # Release version tracking
  config.release = ENV.fetch("APP_VERSION", "unknown")

  # Filter sensitive parameters
  config.before_send = lambda do |event, _hint|
    # Filter sensitive data from the event
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    event.request.data = filter.filter(event.request.data) if event.request&.data
    event
  end

  # Exclude common non-actionable errors
  config.excluded_exceptions += [
    "ActionController::RoutingError",
    "ActionController::BadRequest",
    "ActionController::UnknownFormat"
  ]

  # Only enable in production/staging (disable in development/test)
  config.enabled_environments = %w[production staging]
end
