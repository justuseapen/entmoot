# frozen_string_literal: true

class OutreachMailer < ApplicationMailer
  default from: "Entmoot <hello@entmoot.app>"

  def re_engagement(user, family, message)
    @user = user
    @family = family
    @message = message
    @unsubscribe_token = generate_unsubscribe_token(user, :reengagement)
    @app_url = build_app_url(family, message[:link])

    mail(to: user.email, subject: message[:title])
  end

  private

  def generate_unsubscribe_token(user, type)
    payload = { user_id: user.id, type: type, exp: 1.year.from_now.to_i }
    JWT.encode(payload, Rails.application.secret_key_base)
  end

  def build_app_url(family, path)
    base = mailer_base_url
    return "#{base}#{path}" if path.start_with?("/families/") || family.nil?

    "#{base}/families/#{family.id}#{path}"
  end

  def mailer_base_url
    opts = Rails.application.config.action_mailer.default_url_options
    protocol = Rails.env.production? ? "https" : "http"
    port_str = opts[:port] && [80, 443].exclude?(opts[:port]) ? ":#{opts[:port]}" : ""
    "#{protocol}://#{opts[:host]}#{port_str}"
  end
end
