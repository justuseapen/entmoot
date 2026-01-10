# frozen_string_literal: true

module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        def create
          user = User.new(sign_up_params)

          if user.save
            token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
            response.headers["Authorization"] = "Bearer #{token}"

            render json: {
              message: "Signed up successfully.",
              user: user_response(user)
            }, status: :created
          else
            render json: {
              error: "Sign up failed.",
              errors: user.errors.full_messages
            }, status: :unprocessable_content
          end
        end

        private

        def sign_up_params
          params.require(:user).permit(:email, :password, :password_confirmation, :name, :avatar_url)
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
