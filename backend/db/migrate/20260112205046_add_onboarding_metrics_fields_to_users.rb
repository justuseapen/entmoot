# frozen_string_literal: true

class AddOnboardingMetricsFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    change_table :users, bulk: true do |t|
      t.datetime :onboarding_wizard_completed_at
      t.integer :onboarding_wizard_last_step
      t.datetime :first_family_invite_sent_at
    end
  end
end
