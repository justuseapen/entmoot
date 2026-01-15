# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ErrorResponse

  rescue_from StandardError, with: :handle_unexpected_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found

  private

  def handle_not_found(exception = nil)
    resource_name = exception&.model || "Record"
    render_not_found(resource_name, suggestion: "Please check the URL or go back to the previous page.")
  end

  def handle_unexpected_error(exception)
    # Report to Sentry/Glitchtip with additional context
    Sentry.capture_exception(exception) do |scope|
      scope.set_user(id: current_user&.id) if current_user
      scope.set_tags(
        path: request.path,
        method: request.method
      )
    end

    # Re-raise in development/test for debugging
    raise exception if Rails.env.local?

    render_error(
      "Something went wrong. Please try again.",
      status: :internal_server_error,
      suggestion: "If this problem persists, please contact support."
    )
  end
end
