# frozen_string_literal: true

class CustomDeviseMailer < Devise::Mailer
  helper :application
  include Devise::Controllers::UrlHelpers
  default template_path: "devise/mailer"

  def reset_password_instructions(record, token, opts = {})
    @token = token
    @resource = record
    @reset_password_url = "#{frontend_url}/reset-password?reset_password_token=#{token}"

    mail(
      to: record.email,
      subject: "Reset password instructions",
      template_path: "custom_devise_mailer"
    )
  end

  private

  def frontend_url
    if Rails.env.production?
      "https://app.entmoot.app"
    else
      "http://localhost:5173"
    end
  end
end
