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
          collection do
            post "update_positions"
            post "assess_trackability"
          end
          member do
            post "refine"
            post "regenerate_sub_goals"
          end
        end
        resource :goal_import, only: [:create] do
          get :status, on: :member
        end
        resources :daily_plans, only: %i[index show update] do
          get "today", on: :collection
        end
        resources :habits, only: %i[index create update destroy] do
          post "update_positions", on: :collection
        end
        resources :reflections, only: %i[index show create update destroy]
        resources :weekly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resources :monthly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resources :quarterly_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resources :annual_reviews, only: %i[index show update destroy] do
          get "current", on: :collection
          get "metrics", on: :member
        end
        resource :leaderboard, only: [:show]
        resource :activity_feed, only: [:show]
        resources :my_deadlines, only: [:index]
        resources :mentions, only: [] do
          get "recent", on: :collection
        end
      end

      # Onboarding routes
      scope :onboarding do
        get "status", to: "onboarding#status"
        post "step/:step_name", to: "onboarding#update_step"
        post "skip/:step_name", to: "onboarding#skip_step"
        post "auto_complete", to: "onboarding#auto_complete"
      end
      post "calendar_waitlist", to: "onboarding#calendar_waitlist"

      # User preferences (scoped to current user via /users/me)
      scope "users/me" do
        resource :notification_preferences, only: %i[show update]
        resource :phone_number, only: %i[show create destroy] do
          post "verify", on: :member
        end
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
        # First actions status
        resource :first_actions, only: [:show]
        # Contextual tips
        resource :tips, only: [:show] do
          post "mark_shown", on: :member
          patch "toggle", on: :member
        end
        # Google Calendar integration
        resource :google_calendar, only: %i[show destroy], controller: "google_calendar" do
          get "auth_url", on: :member
          get "callback", on: :member
          get "calendars", on: :member
          post "connect", on: :member
          post "sync", on: :member
          post "pause", on: :member
          post "resume", on: :member
        end
      end

      # All badges (public-ish, requires auth)
      resources :badges, only: [:index]

      # Notifications
      resources :notifications, only: [:index] do
        post "mark_as_read", on: :member
        post "mark_all_as_read", on: :collection
      end

      # Device tokens (for push notifications)
      resources :device_tokens, only: %i[create destroy] do
        delete "unregister", on: :collection
      end

      # Reflection prompts (public endpoint)
      resources :reflection_prompts, only: [:index]

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
        resource :onboarding_metrics, only: [:show]
        resources :feedback, only: %i[index show update], controller: "feedback"
      end
    end
  end
end
