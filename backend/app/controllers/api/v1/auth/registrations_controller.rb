# frozen_string_literal: true

module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        def create
          user = User.new(sign_up_params)

          if user.save
            render_success_response(user)
          else
            render_error_response(user)
          end
        end

        private

        def sign_up_params
          params.require(:user).permit(:email, :password, :password_confirmation, :name, :avatar_url)
        end

        def render_success_response(user)
          token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
          refresh = RefreshToken.create!(user: user, expires_at: 30.days.from_now)
          response.headers["Authorization"] = "Bearer #{token}"

          render json: {
            message: "Signed up successfully.",
            user: user_response(user),
            token: token,
            refresh_token: refresh.token
          }, status: :created
        end

        def render_error_response(user)
          render json: {
            error: "Sign up failed.",
            errors: user.errors.full_messages
          }, status: :unprocessable_content
        end

        def user_response(user)
          {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            created_at: user.created_at
          }
        end
      end
    end
  end
end
