# frozen_string_literal: true

# SendGrid SMTP Configuration for Production
# This initializer configures Action Mailer to use SendGrid for email delivery

if Rails.env.production?
  sendgrid_key = ENV.fetch("SENDGRID_API_KEY", nil)

  if sendgrid_key.present?
    Rails.application.config.action_mailer.delivery_method = :smtp
    Rails.application.config.action_mailer.smtp_settings = {
      address: "smtp.sendgrid.net",
      port: 587,
      domain: ENV.fetch("DOMAIN", "entmoot.app"),
      user_name: "apikey",
      password: sendgrid_key,
      authentication: :plain,
      enable_starttls_auto: true
    }
  else
    # Fallback to :logger when SMTP not configured - logs emails instead of failing
    Rails.application.config.action_mailer.delivery_method = :logger
    Rails.logger.warn("SENDGRID_API_KEY not set - emails will be logged but not sent")
  end
end
