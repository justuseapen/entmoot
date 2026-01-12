# frozen_string_literal: true

class AddOnboardingEmailsSentToUsers < ActiveRecord::Migration[7.2]
  def change
    change_table :users, bulk: true do |t|
      t.jsonb :onboarding_emails_sent, default: {}
      t.boolean :onboarding_unsubscribed, default: false, null: false
    end
  end
end
