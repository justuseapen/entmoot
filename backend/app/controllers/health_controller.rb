# frozen_string_literal: true

class HealthController < ApplicationController
  def show
    render json: {
      status: "ok",
      timestamp: Time.current.iso8601
    }, status: :ok
  end

  # Temporary endpoint to verify Sentry/Glitchtip integration
  # Remove after confirming errors are being captured
  def sentry_test
    raise StandardError, "Sentry test error from Entmoot backend - #{Time.current.iso8601}"
  end
end
