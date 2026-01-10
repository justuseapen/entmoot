# frozen_string_literal: true

Rails.application.routes.draw do
  # Devise routes for password reset email link (defines edit_user_password_url)
  devise_for :users, skip: %i[sessions registrations], controllers: { passwords: "devise/passwords" }

  # Health check endpoint
  get "health", to: "health#show"

  # Rails default health check
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      scope :auth, module: :auth, as: :auth do
        post "register", to: "registrations#create"
        post "login", to: "sessions#create"
        delete "logout", to: "sessions#destroy"
        get "me", to: "users#me"
        post "password", to: "passwords#create"
        put "password", to: "passwords#update"
        post "refresh", to: "tokens#refresh"
      end
    end
  end
end
