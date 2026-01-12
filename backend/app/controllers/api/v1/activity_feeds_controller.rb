# frozen_string_literal: true

module Api
  module V1
    class ActivityFeedsController < BaseController
      before_action :set_family

      def show
        authorize @family, policy_class: ActivityFeedPolicy

        limit = (params[:limit] || 10).to_i.clamp(1, 50)
        activities = ActivityFeedService.get_family_activity(@family, limit: limit)

        render json: { activities: activities }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      end
    end
  end
end
