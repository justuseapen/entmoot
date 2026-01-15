# frozen_string_literal: true

module Api
  module V1
    module Auth
      class TokensController < ApplicationController
        # Token refresh is no longer needed with session-based auth
        # Sessions are maintained via cookies automatically
        def refresh
          render json: {
            error: "Token refresh is deprecated. Please use session-based authentication."
          }, status: :gone
        end
      end
    end
  end
end
