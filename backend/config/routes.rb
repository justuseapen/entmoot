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
        resources :goals, only: %i[index show create update destroy] do
          post "refine", on: :member
        end
        resources :daily_plans, only: %i[show update] do
          get "today", on: :collection
        end
        resources :reflections, only: %i[index show create update destroy]
        resources :weekly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resource :leaderboard, only: [:show]
        resource :activity_feed, only: [:show]
      end

      # User preferences (scoped to current user via /users/me)
      scope "users/me" do
        resource :notification_preferences, only: %i[show update]
        resources :streaks, only: [:index]
        resources :points, only: [:index]
        get "badges", to: "badges#user_badges"
        patch "profile", to: "profile#update"
        patch "password", to: "profile#update_password"
        delete "/", to: "profile#destroy"
        get "export", to: "profile#export"
        # Tour preferences
        resource :tour_preferences, only: [:show] do
          post "complete", on: :member
          post "dismiss", on: :member
          post "restart", on: :member
        end
        # First goal prompt
        resource :first_goal_prompt, only: [:show] do
          post "dismiss", on: :member
          get "suggestions", on: :member
        end
        # First reflection prompt
        resource :first_reflection_prompt, only: %i[show create] do
          post "dismiss", on: :member
        end
      end

      # All badges (public-ish, requires auth)
      resources :badges, only: [:index]

      # Notifications
      resources :notifications, only: [:index] do
        post "mark_as_read", on: :member
        post "mark_all_as_read", on: :collection
      end

      # Reflection prompts (public endpoint)
      resources :reflection_prompts, only: [:index]

      # Accept invitation (public route with token)
      post "invitations/:token/accept", to: "invitations#accept", as: :accept_invitation

      # Email unsubscribe (public route with token)
      get "unsubscribe", to: "email_subscriptions#unsubscribe", as: :unsubscribe
    end
  end
end
