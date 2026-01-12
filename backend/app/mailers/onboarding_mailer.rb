# frozen_string_literal: true

# rubocop:disable Rails/I18nLocaleTexts
class OnboardingMailer < ApplicationMailer
  default from: "Entmoot <hello@entmoot.app>"

  # Day 1: Welcome + getting started recap
  def welcome(user)
    @user = user
    @family = user.families.first
    @unsubscribe_token = generate_unsubscribe_token(user)
    @app_url = app_url("", @family)

    mail(
      to: user.email,
      subject: "Welcome to Entmoot! Let's get your family organized"
    )
  end

  # Day 3: Morning planning nudge (skip if user has daily plans)
  def morning_planning_intro(user)
    @user = user
    @family = user.families.first
    @unsubscribe_token = generate_unsubscribe_token(user)
    @app_url = app_url("/planner", @family)

    mail(
      to: user.email,
      subject: "Have you tried morning planning? Start your day with intention"
    )
  end

  # Day 5: AI coach introduction
  def ai_coach_intro(user)
    @user = user
    @family = user.families.first
    @unsubscribe_token = generate_unsubscribe_token(user)
    @app_url = app_url("/goals", @family)

    mail(
      to: user.email,
      subject: "Meet your AI coach - Get personalized goal guidance"
    )
  end

  # Day 7: Weekly review reminder
  def weekly_review_intro(user)
    @user = user
    @family = user.families.first
    @unsubscribe_token = generate_unsubscribe_token(user)
    @app_url = app_url("/weekly-review", @family)

    mail(
      to: user.email,
      subject: "Time for your first weekly review! Celebrate your wins"
    )
  end

  # Day 14: Check-in and feedback request
  def two_week_check_in(user)
    @user = user
    @family = user.families.first
    @unsubscribe_token = generate_unsubscribe_token(user)
    @app_url = app_url("", @family)

    mail(
      to: user.email,
      subject: "How's it going? We'd love your feedback"
    )
  end

  private

  def generate_unsubscribe_token(user)
    payload = { user_id: user.id, type: :onboarding, exp: 1.year.from_now.to_i }
    JWT.encode(payload, Rails.application.secret_key_base)
  end

  def app_url(path, family)
    host = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]
    protocol = Rails.env.production? ? "https" : "http"
    port_string = port && port != 80 && port != 443 ? ":#{port}" : ""

    if family
      "#{protocol}://#{host}#{port_string}/families/#{family.id}#{path}"
    else
      "#{protocol}://#{host}#{port_string}#{path}"
    end
  end
end
# rubocop:enable Rails/I18nLocaleTexts
