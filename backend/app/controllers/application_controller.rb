# frozen_string_literal: true

class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_unexpected_error

  private

  def handle_unexpected_error(exception)
    # Report to AppSignal with additional context
    Appsignal.send_error(exception) do |transaction|
      transaction.set_tags(
        user_id: current_user&.id,
        path: request.path,
        method: request.method
      )
    end

    # Re-raise in development for debugging
    raise exception if Rails.env.development?

    render json: { error: "An unexpected error occurred" }, status: :internal_server_error
  end
end
