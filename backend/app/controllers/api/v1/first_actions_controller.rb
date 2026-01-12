# frozen_string_literal: true

module Api
  module V1
    class FirstActionsController < BaseController
      def show
        render json: {
          first_actions: current_user.first_actions || {},
          all_completed: all_first_actions_completed?
        }
      end

      private

      def all_first_actions_completed?
        User::FIRST_ACTION_TYPES.all? { |type| current_user.first_action_completed?(type) }
      end
    end
  end
end
