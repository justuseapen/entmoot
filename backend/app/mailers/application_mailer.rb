# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: "Entmoot <hello@entmoot.app>"
  layout "mailer"
end
