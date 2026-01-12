# frozen_string_literal: true

# SendGrid SMTP Configuration for Production
# This initializer configures Action Mailer to use SendGrid for email delivery

if Rails.env.production? && ENV.fetch("SENDGRID_API_KEY", nil).present?
  Rails.application.config.action_mailer.delivery_method = :smtp
  Rails.application.config.action_mailer.smtp_settings = {
    address: "smtp.sendgrid.net",
    port: 587,
    domain: ENV.fetch("DOMAIN", "entmoot.app"),
    user_name: "apikey",
    password: ENV.fetch("SENDGRID_API_KEY", nil),
    authentication: :plain,
    enable_starttls_auto: true
  }
end
