# frozen_string_literal: true

module Api
  module V1
    module Auth
      class TokensController < ApplicationController
        def refresh
          refresh_token = RefreshToken.find_by(token: params[:refresh_token])

          return render_invalid_token if refresh_token.nil?
          return render_inactive_token(refresh_token) unless refresh_token.active?

          process_token_refresh(refresh_token)
        end

        private

        def render_invalid_token
          render json: { error: "Invalid refresh token." }, status: :unauthorized
        end

        def render_inactive_token(refresh_token)
          error_message = refresh_token.revoked? ? "Refresh token has been revoked." : "Refresh token has expired."
          render json: { error: error_message }, status: :unauthorized
        end

        def process_token_refresh(refresh_token)
          user = refresh_token.user
          refresh_token.revoke!

          new_refresh_token = user.refresh_tokens.create!(expires_at: 30.days.from_now)
          access_token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

          render json: {
            message: "Token refreshed successfully.",
            access_token: access_token,
            refresh_token: new_refresh_token.token,
            user: user_response(user)
          }, status: :ok
        end

        def user_response(user)
          { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, created_at: user.created_at }
        end
      end
    end
  end
end
