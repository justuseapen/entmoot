# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      include Pundit::Authorization
      include UserActivity

      before_action :authenticate_user!

      rescue_from Pundit::NotAuthorizedError, with: :render_forbidden

      private

      # render_error is inherited from ErrorResponse concern via ApplicationController
      # render_errors kept for backward compatibility with existing controllers
      def render_errors(errors, status: :unprocessable_content)
        render json: { errors: errors }, status: status
      end

      def render_forbidden
        render_error(
          "You are not authorized to perform this action",
          status: :forbidden,
          suggestion: "Please contact an administrator if you believe this is a mistake."
        )
      end
    end
  end
end
