# frozen_string_literal: true

# Configure devise-jwt for JWT authentication
# Access tokens expire after 24 hours
# Refresh tokens are handled separately with 30-day expiration

Devise.setup do |config|
  config.jwt do |jwt|
    # Secret key for signing JWTs
    jwt.secret = ENV.fetch("DEVISE_JWT_SECRET_KEY") do
      Rails.application.credentials.devise_jwt_secret_key ||
        Rails.application.secret_key_base
    end

    # Strategy for dispatching tokens
    jwt.dispatch_requests = [
      ["POST", %r{^/api/v1/auth/login$}],
      ["POST", %r{^/api/v1/auth/register$}]
    ]

    # Strategy for revoking tokens on logout
    jwt.revocation_requests = [
      ["DELETE", %r{^/api/v1/auth/logout$}]
    ]

    # Token expiration time (24 hours)
    jwt.expiration_time = 24.hours.to_i

    # Custom header name for JWT (standard Authorization header)
    # jwt.request_formats = { user: [:json] }

    # The name of the dispatch header
    jwt.aud_header = "JWT_AUD"
  end
end
