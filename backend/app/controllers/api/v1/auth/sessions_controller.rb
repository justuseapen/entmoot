# frozen_string_literal: true

module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        before_action :authenticate_user!, only: [:destroy]

        def create
          user = User.find_for_database_authentication(email: params.dig(:user, :email))

          return render_user_not_found if user.nil?
          return render_invalid_password unless user.valid_password?(params.dig(:user, :password))

          sign_in(:user, user)
          render json: { message: "Logged in successfully.", user: user_response(user) }, status: :ok
        end

        def destroy
          if current_user
            sign_out(current_user)
            render json: { message: "Logged out successfully." }, status: :ok
          else
            render json: { error: "Could not log out. No active session." }, status: :unauthorized
          end
        end

        private

        def user_response(user)
          { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, created_at: user.created_at }
        end

        def render_user_not_found
          render_error("No account found with this email.",
                       status: :unauthorized,
                       suggestion: "Would you like to create one?")
        end

        def render_invalid_password
          render_error("Incorrect email or password. Please try again.", status: :unauthorized)
        end
      end
    end
  end
end
