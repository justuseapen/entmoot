# frozen_string_literal: true

module Api
  module V1
    module Auth
      class PasswordsController < ApplicationController
        FRIENDLY_ERROR_MESSAGES = {
          email_not_found: "We couldn't find an account with this email.",
          invalid_token: "This password reset link has expired. Please request a new one.",
          password_too_short: "Password must be at least 6 characters.",
          password_mismatch: "Password confirmation doesn't match."
        }.freeze

        # POST /api/v1/auth/password - Request password reset
        def create
          user = User.find_by(email: params.dig(:user, :email))

          if user
            user.send_reset_password_instructions
            render json: {
              message: "Password reset instructions have been sent to your email."
            }, status: :ok
          else
            render_error(
              FRIENDLY_ERROR_MESSAGES[:email_not_found],
              errors: ["Email not found"]
            )
          end
        end

        # PUT /api/v1/auth/password - Reset password with token
        def update
          user = User.reset_password_by_token(password_params)

          if user.errors.empty?
            render json: {
              message: "Password has been reset successfully."
            }, status: :ok
          else
            error_message = detect_reset_error_message(user)
            render_error(
              error_message,
              errors: user.errors.full_messages
            )
          end
        end

        private

        def password_params
          params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
        end

        def detect_reset_error_message(user)
          if user.errors.where(:reset_password_token, :invalid).any?
            FRIENDLY_ERROR_MESSAGES[:invalid_token]
          elsif user.errors.where(:password, :too_short).any?
            FRIENDLY_ERROR_MESSAGES[:password_too_short]
          elsif user.errors.where(:password_confirmation, :confirmation).any?
            FRIENDLY_ERROR_MESSAGES[:password_mismatch]
          else
            "Unable to reset password."
          end
        end
      end
    end
  end
end
