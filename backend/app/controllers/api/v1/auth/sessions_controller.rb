# frozen_string_literal: true

module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        before_action :authenticate_user!, only: [:destroy]

        def create
          user = User.find_for_database_authentication(email: params.dig(:user, :email))

          if user&.valid_password?(params.dig(:user, :password))
            render_login_success(user)
          else
            render json: { error: "Invalid email or password." }, status: :unauthorized
          end
        end

        def destroy
          token = request.headers["Authorization"]&.split&.last

          if token && current_user
            revoke_current_session(token)
            # Clear session for session-based auth
            request.env["warden"].logout(:user)
            render json: { message: "Logged out successfully." }, status: :ok
          else
            render json: { error: "Could not log out. No active session." }, status: :unauthorized
          end
        end

        private

        def render_login_success(user)
          jwt_token = generate_jwt(user)
          refresh_token = create_refresh_token(user)

          # Set user in session for session-based auth (cross-origin support)
          request.env["warden"].set_user(user, scope: :user, store: true)

          response.headers["Authorization"] = "Bearer #{jwt_token}"
          render json: {
            message: "Logged in successfully.",
            user: user_response(user),
            refresh_token: refresh_token.token
          }, status: :ok
        end

        def generate_jwt(user)
          Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        end

        def create_refresh_token(user)
          user.refresh_tokens.create!(expires_at: 30.days.from_now)
        end

        def revoke_current_session(token)
          payload = JWT.decode(token, nil, false).first
          JwtDenylist.create!(jti: payload["jti"], exp: Time.zone.at(payload["exp"]))
          current_user.refresh_tokens.active.update_all(revoked_at: Time.current) # rubocop:disable Rails/SkipsModelValidations
        end

        def user_response(user)
          { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, created_at: user.created_at }
        end
      end
    end
  end
end
