# frozen_string_literal: true

module Api
  module V1
    module Auth
      class PasswordsController < ApplicationController
        # POST /api/v1/auth/password - Request password reset
        def create
          user = User.find_by(email: params.dig(:user, :email))

          if user
            user.send_reset_password_instructions
            render json: {
              message: "Password reset instructions have been sent to your email."
            }, status: :ok
          else
            render json: {
              error: "Unable to send password reset instructions.",
              errors: ["Email not found"]
            }, status: :unprocessable_content
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
            render json: {
              error: "Unable to reset password.",
              errors: user.errors.full_messages
            }, status: :unprocessable_content
          end
        end

        private

        def password_params
          params.require(:user).permit(:reset_password_token, :password, :password_confirmation)
        end
      end
    end
  end
end
