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

      # Family routes
      resources :families, only: %i[index show create update destroy] do
        get "members", on: :member
        resources :invitations, only: %i[index create destroy] do
          post "resend", on: :member
        end
        resources :memberships, only: %i[index update destroy]
        resources :pets, only: %i[index show create update destroy]
        resources :goals, only: %i[index show create update destroy]
      end

      # Accept invitation (public route with token)
      post "invitations/:token/accept", to: "invitations#accept", as: :accept_invitation
    end
  end
end
