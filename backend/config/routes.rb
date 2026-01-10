# frozen_string_literal: true

Rails.application.routes.draw do
  # Health check endpoint
  get "health", to: "health#show"

  # Rails default health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    namespace :v1 do
      # Future API routes will go here
    end
  end
end
