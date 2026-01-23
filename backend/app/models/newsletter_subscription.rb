# frozen_string_literal: true

class NewsletterSubscription < ApplicationRecord
  enum :status, { pending: 0, confirmed: 1, unsubscribed: 2 }

  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP },
                    uniqueness: { case_sensitive: false }
end
