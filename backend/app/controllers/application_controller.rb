# frozen_string_literal: true

class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_unexpected_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found

  private

  def handle_not_found
    render json: { error: "Record not found" }, status: :not_found
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

    render json: { error: "An unexpected error occurred" }, status: :internal_server_error
  end
end
