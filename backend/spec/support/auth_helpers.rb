# frozen_string_literal: true

module AuthHelpers
  # Signs in a user via session-based auth and returns headers with session cookie
  # For session-based auth, we need to actually sign in the user and get the session cookie
  def sign_in_user(user)
    post "/api/v1/auth/login", params: { user: { email: user.email, password: user.password || "password123" } }
    # The session cookie will be stored in the response and used in subsequent requests
  end

  # Alternative: Use Warden's test helpers to sign in directly
  def auth_headers(user)
    # For session-based auth in tests, we use Warden's test helper
    # This sets up the session directly without going through the login flow
    login_as(user, scope: :user)
    {} # No special headers needed for session auth
  end

  def json_response
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
  config.include Warden::Test::Helpers

  config.after(type: :request) do
    Warden.test_reset!
  end
end
