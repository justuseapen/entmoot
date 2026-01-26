# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Extract JWT token from query parameter
      token = request.params[:token]
      return reject_unauthorized_connection if token.blank?

      # Decode and verify JWT token
      begin
        # Use Warden's JWT configuration to decode the token
        secret_key = ENV.fetch("DEVISE_JWT_SECRET_KEY") do
          Rails.application.credentials.devise_jwt_secret_key ||
            Rails.application.secret_key_base
        end

        payload = JWT.decode(
          token,
          secret_key,
          true,
          { algorithm: "HS256" }
        ).first

        # Extract user ID from the JWT payload (sub claim)
        user_id = payload["sub"]
        user = User.find_by(id: user_id)

        user || reject_unauthorized_connection
      rescue JWT::DecodeError, JWT::ExpiredSignature
        reject_unauthorized_connection
      end
    end
  end
end
