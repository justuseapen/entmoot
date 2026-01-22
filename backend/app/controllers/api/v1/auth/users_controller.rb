# frozen_string_literal: true

module Api
  module V1
    module Auth
      class UsersController < Api::V1::BaseController
        def me
          render json: {
            user: user_response(current_user)
          }, status: :ok
        end

        private

        def user_response(user)
          {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            onboarding_required: user.onboarding_required?,
            onboarding_wizard_completed_at: user.onboarding_wizard_completed_at
          }
        end
      end
    end
  end
end
