# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: "Entmoot <hello@mail.entmoot.app>"
  layout "mailer"
end
