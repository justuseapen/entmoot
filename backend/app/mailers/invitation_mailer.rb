# frozen_string_literal: true

class InvitationMailer < ApplicationMailer
  default from: "Entmoot <hello@mail.entmoot.app>"

  def send_invitation(invitation)
    @invitation = invitation
    @inviter = invitation.inviter
    @family = invitation.family
    @accept_url = invitation_accept_url(invitation.token)

    mail(
      to: invitation.email,
      subject: "#{@inviter.name} invited you to join #{@family.name} on Entmoot"
    )
  end

  private

  def invitation_accept_url(token)
    host = Rails.application.config.action_mailer.default_url_options[:host]
    port = Rails.application.config.action_mailer.default_url_options[:port]
    protocol = Rails.env.production? ? "https" : "http"
    port_string = port && port != 80 && port != 443 ? ":#{port}" : ""
    "#{protocol}://#{host}#{port_string}/accept-invitation/#{token}"
  end
end
