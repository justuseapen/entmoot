# frozen_string_literal: true

module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        FRIENDLY_ERROR_MESSAGES = {
          email_taken: ["This email is already registered.", "Try signing in instead."],
          password_too_short: ["Password must be at least 6 characters.", nil],
          password_blank: ["Password is required.", nil],
          email_invalid: ["Please enter a valid email address.", nil],
          email_blank: ["Email is required.", nil],
          name_blank: ["Name is required.", nil]
        }.freeze

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
          friendly_message, suggestion = friendly_registration_error(user.errors)

          render_error(
            friendly_message,
            status: :unprocessable_content,
            errors: user.errors.full_messages,
            suggestion: suggestion
          )
        end

        def friendly_registration_error(errors)
          error_key = detect_error_type(errors)
          FRIENDLY_ERROR_MESSAGES.fetch(error_key) do
            [errors.full_messages.first || "Registration failed. Please check your information.", nil]
          end
        end

        def detect_error_type(errors)
          return :email_taken if errors.where(:email, :taken).any?
          return :password_too_short if errors.where(:password, :too_short).any?
          return :password_blank if errors.where(:password, :blank).any?
          return :email_invalid if errors.where(:email, :invalid).any?
          return :email_blank if errors.where(:email, :blank).any?
          return :name_blank if errors.where(:name, :blank).any?

          :unknown
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
