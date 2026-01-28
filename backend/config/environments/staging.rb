# frozen_string_literal: true

require "active_support/core_ext/integer/time"

# Staging environment configuration
# Mirrors production settings but with more verbose logging and deprecation warnings
# to catch issues before they reach production.

Rails.application.configure do
  # Code is not reloaded between requests (same as production).
  config.enable_reloading = false

  # Eager load code on boot for production-like behavior.
  config.eager_load = true

  # Full error reports are disabled (same as production).
  config.consider_all_requests_local = false

  # Store uploaded files on the local file system.
  config.active_storage.service = :local

  # ActionCable allowed origins for staging domain.
  config.action_cable.allowed_request_origins = [
    %r{https://staging\.entmoot\.app},
    %r{http://staging\.entmoot\.app},
    %r{https://#{ENV.fetch("DOMAIN", "staging.entmoot.app")}},
    %r{http://#{ENV.fetch("DOMAIN", "staging.entmoot.app")}}
  ]

  # Force all access to the app over SSL (same as production).
  config.force_ssl = true

  # Log to STDOUT for Docker container compatibility.
  config.logger = ActiveSupport::Logger.new($stdout)
                                       .tap  { |logger| logger.formatter = Logger::Formatter.new }
                                       .then { |logger| ActiveSupport::TaggedLogging.new(logger) }

  # Prepend all log lines with the following tags.
  config.log_tags = [:request_id]

  # Use debug-level logging by default for staging to help catch issues.
  # Can be overridden via RAILS_LOG_LEVEL environment variable.
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "debug")

  # Disable caching for Action Mailer templates.
  config.action_mailer.perform_caching = false

  # Action Mailer configuration for staging.
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.default_url_options = {
    host: ENV.fetch("DOMAIN", "staging.entmoot.app"),
    protocol: "https"
  }
  config.action_mailer.default_options = {
    from: ENV.fetch("MAILER_FROM", "staging@mail.entmoot.app")
  }

  # Enable locale fallbacks for I18n.
  config.i18n.fallbacks = true

  # Enable deprecation warnings in staging to catch issues before production.
  # This helps identify deprecated code that should be updated.
  config.active_support.report_deprecations = true
  config.active_support.deprecation = :log

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections.
  config.active_record.attributes_for_inspect = [:id]
end
