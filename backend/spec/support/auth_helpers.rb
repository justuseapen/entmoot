# frozen_string_literal: true

module AuthHelpers
  # Generate a JWT token for testing
  def generate_jwt_token(user)
    secret_key = ENV.fetch("DEVISE_JWT_SECRET_KEY") do
      Rails.application.credentials.devise_jwt_secret_key ||
        Rails.application.secret_key_base
    end

    payload = {
      sub: user.id.to_s,
      scp: "user",
      iat: Time.now.to_i,
      exp: 24.hours.from_now.to_i,
      jti: SecureRandom.uuid
    }

    JWT.encode(payload, secret_key, "HS256")
  end

  # Returns headers with JWT Bearer token for authenticated requests
  def auth_headers(user)
    token = generate_jwt_token(user)
    { "Authorization" => "Bearer #{token}" }
  end

  # Signs in a user via the login endpoint and extracts the JWT token from response
  def sign_in_user(user)
    post "/api/v1/auth/login", params: { user: { email: user.email, password: user.password || "password123" } }
    token = response.headers["Authorization"]&.gsub("Bearer ", "")
    { "Authorization" => "Bearer #{token}" }
  end

  def json_response
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
