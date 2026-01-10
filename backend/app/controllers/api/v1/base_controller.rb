# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      include Pundit::Authorization

      before_action :authenticate_user!

      rescue_from Pundit::NotAuthorizedError, with: :render_forbidden

      private

      def render_error(message, status: :unprocessable_content)
        render json: { error: message }, status: status
      end

      def render_errors(errors, status: :unprocessable_content)
        render json: { errors: errors }, status: status
      end

      def render_forbidden
        render json: { error: "You are not authorized to perform this action" }, status: :forbidden
      end
    end
  end
end
