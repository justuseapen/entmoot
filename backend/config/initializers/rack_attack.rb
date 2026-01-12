# frozen_string_literal: true

module Rack
  class Attack
    # Use Redis for caching if available, otherwise use memory store
    cache_config = Rails.application.config.cache_store
    store_type = cache_config.is_a?(Array) ? cache_config.first : cache_config
    Rack::Attack.cache.store = Rails.cache if store_type == :redis_cache_store

    # Throttle AI refinement requests to prevent API abuse
    # Limit: 10 requests per user per hour
    throttle("goal_refinement/user", limit: 10, period: 1.hour) do |req|
      if req.path.match?(%r{/api/v1/families/\d+/goals/\d+/refine}) && req.post?
        # Extract user ID from JWT token if present
        extract_user_id_from_request(req)
      end
    end

    # Stricter throttle for unauthenticated requests (fallback to IP)
    throttle("goal_refinement/ip", limit: 5, period: 1.hour) do |req|
      if req.path.match?(%r{/api/v1/families/\d+/goals/\d+/refine}) && req.post? && !extract_user_id_from_request(req)
        # Use IP if we can't identify the user
        req.ip
      end
    end

    # General API rate limit (more lenient)
    throttle("api/general", limit: 300, period: 5.minutes) do |req|
      req.ip if req.path.start_with?("/api/")
    end

    # Custom response for throttled requests
    self.throttled_responder = lambda do |req|
      match_data = req.env["rack.attack.match_data"]
      now = match_data[:epoch_time]
      retry_after = match_data[:period] - (now % match_data[:period])

      [
        429,
        {
          "Content-Type" => "application/json",
          "Retry-After" => retry_after.to_s
        },
        [{ error: "Rate limit exceeded. Please try again later.", retry_after: retry_after }.to_json]
      ]
    end

    class << self
      def extract_user_id_from_request(req)
        auth_header = req.get_header("HTTP_AUTHORIZATION")
        return nil unless auth_header&.start_with?("Bearer ")

        token = auth_header.split.last
        decode_user_id(token)
      end

      private

      def decode_user_id(token)
        payload = Warden::JWTAuth::TokenDecoder.new.call(token)
        payload["sub"]
      rescue StandardError
        nil
      end
    end
  end
end
