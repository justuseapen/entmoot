# frozen_string_literal: true

class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_unexpected_error
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found

  private

  def handle_not_found
    render json: { error: "Record not found" }, status: :not_found
  end

  def handle_unexpected_error(exception)
    # Report to AppSignal with additional context
    if defined?(Appsignal) && Appsignal.respond_to?(:send_error)
      Appsignal.send_error(exception) do |transaction|
        transaction.set_tags(
          user_id: current_user&.id,
          path: request.path,
          method: request.method
        )
      end
    end

    # Re-raise in development/test for debugging
    raise exception if Rails.env.development? || Rails.env.test?

    render json: { error: "An unexpected error occurred" }, status: :internal_server_error
  end
end
