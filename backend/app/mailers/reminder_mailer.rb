# frozen_string_literal: true

# rubocop:disable Rails/I18nLocaleTexts
class ReminderMailer < ApplicationMailer
  default from: "Entmoot <reminders@mail.entmoot.app>"

  def morning_planning(user, family)
    @user = user
    @family = family
    @unsubscribe_token = generate_unsubscribe_token(user, :morning_planning)
    @app_url = app_url(family, "/planner")

    mail(
      to: user.email,
      subject: "Time for Morning Planning - What are your top priorities today?"
    )
  end

  def evening_reflection(user, family)
    @user = user
    @family = family
    @unsubscribe_token = generate_unsubscribe_token(user, :evening_reflection)
    @app_url = app_url(family, "/reflection")

    mail(
      to: user.email,
      subject: "Evening Reflection - Take a moment to reflect on your day"
    )
  end

  def weekly_review(user, family)
    @user = user
    @family = family
    @unsubscribe_token = generate_unsubscribe_token(user, :weekly_review)
    @app_url = app_url(family, "/weekly-review")

    mail(
      to: user.email,
      subject: "Weekly Review Time - Celebrate wins and plan ahead!"
    )
  end

  def goal_check_in(user, family, goal)
    @user = user
    @family = family
    @goal = goal
    @unsubscribe_token = generate_unsubscribe_token(user, :goal_check_in)
    @app_url = app_url(family, "/goals/#{goal.id}")

    mail(
      to: user.email,
      subject: "Goal Check-in: #{goal.title}"
    )
  end

  def monthly_review(user, family)
    @user = user
    @family = family
    @unsubscribe_token = generate_unsubscribe_token(user, :monthly_review)
    @app_url = app_url(family, "/monthly-review")

    mail(
      to: user.email,
      subject: "Monthly Review Time - Reflect on your month and plan ahead!"
    )
  end

  def quarterly_review(user, family)
    @user = user
    @family = family
    @unsubscribe_token = generate_unsubscribe_token(user, :quarterly_review)
    @app_url = app_url(family, "/quarterly-review")

    mail(
      to: user.email,
      subject: "Quarterly Review Time - Assess your progress and set new objectives!"
    )
  end

  def annual_review(user, family)
    @user = user
    @family = family
    @unsubscribe_token = generate_unsubscribe_token(user, :annual_review)
    @app_url = app_url(family, "/annual-review")

    mail(
      to: user.email,
      subject: "Annual Review Time - Reflect on your year and set intentions!"
    )
  end

  private

  def generate_unsubscribe_token(user, reminder_type)
    payload = { user_id: user.id, reminder_type: reminder_type, exp: 1.year.from_now.to_i }
    JWT.encode(payload, Rails.application.secret_key_base)
  end

  def app_url(family, path)
    host = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]
    protocol = Rails.env.production? ? "https" : "http"
    port_string = port && port != 80 && port != 443 ? ":#{port}" : ""
    "#{protocol}://#{host}#{port_string}/families/#{family.id}#{path}"
  end
end
# rubocop:enable Rails/I18nLocaleTexts
