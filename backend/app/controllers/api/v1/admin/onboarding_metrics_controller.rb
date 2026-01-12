# frozen_string_literal: true

module Api
  module V1
    module Admin
      class OnboardingMetricsController < BaseController
        before_action :authorize_admin!

        def show
          service = OnboardingMetricsService.new(
            start_date: parse_date(params[:start_date]),
            end_date: parse_date(params[:end_date])
          )

          render json: service.metrics
        end

        private

        def authorize_admin!
          return if current_user_is_admin?

          render json: { error: "Admin access required" }, status: :forbidden
        end

        def current_user_is_admin?
          current_user.family_memberships.exists?(role: "admin")
        end

        def parse_date(date_string)
          return nil if date_string.blank?

          Date.parse(date_string).beginning_of_day
        rescue ArgumentError
          nil
        end
      end
    end
  end
end
