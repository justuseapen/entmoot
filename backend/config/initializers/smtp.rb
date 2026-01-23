# frozen_string_literal: true

# Resend SMTP Configuration for Production
# This initializer configures Action Mailer to use Resend for email delivery

if Rails.env.production?
  resend_key = ENV.fetch("RESEND_API_KEY", nil)

  if resend_key.present?
    Rails.application.config.action_mailer.delivery_method = :smtp
    Rails.application.config.action_mailer.smtp_settings = {
      address: "smtp.resend.com",
      port: 587,
      domain: ENV.fetch("DOMAIN", "entmoot.app"),
      user_name: "resend",
      password: resend_key,
      authentication: :plain,
      enable_starttls_auto: true
    }
  else
    # Fallback to :logger when SMTP not configured - logs emails instead of failing
    Rails.application.config.action_mailer.delivery_method = :logger
    Rails.logger.warn("RESEND_API_KEY not set - emails will be logged but not sent")
  end
end
