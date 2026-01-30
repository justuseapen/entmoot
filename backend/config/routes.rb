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
        resources :daily_plans, only: %i[index show update] do
          get "today", on: :collection
        end
        resources :habits, only: %i[index create update destroy] do
          post "update_positions", on: :collection
        end
      end

      # User preferences (scoped to current user via /users/me)
      scope "users/me" do
        resource :notification_preferences, only: %i[show update]
        resource :phone_number, only: %i[show create destroy] do
          post "verify", on: :member
        end
        patch "profile", to: "profile#update"
        patch "password", to: "profile#update_password"
        delete "/", to: "profile#destroy"
        get "export", to: "profile#export"
      end

      # Notifications
      resources :notifications, only: [:index] do
        post "mark_as_read", on: :member
        post "mark_all_as_read", on: :collection
      end

      # Device tokens (for push notifications)
      resources :device_tokens, only: %i[create destroy] do
        delete "unregister", on: :collection
      end

      # Feedback (public for create, authenticated for show)
      resources :feedback, only: %i[create show], controller: "feedback" do
        collection do
          get "eligibility"
          post "dismiss_nps"
          get "nps_follow_up"
        end
      end

      # Accept invitation (public route with token)
      post "invitations/:token/accept", to: "invitations#accept", as: :accept_invitation

      # Email unsubscribe (public route with token)
      get "unsubscribe", to: "email_subscriptions#unsubscribe", as: :unsubscribe

      # Newsletter subscription (public route)
      post "newsletter/subscribe", to: "newsletter_subscriptions#create"

      # Webhooks (public routes)
      post "webhooks/twilio", to: "webhooks#twilio"

      # Admin routes
      namespace :admin do
        resources :feedback, only: %i[index show update], controller: "feedback"
      end
    end
  end
end
