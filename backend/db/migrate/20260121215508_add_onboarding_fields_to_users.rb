class AddOnboardingFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :onboarding_challenge, :string
    add_column :users, :onboarding_skipped_steps, :jsonb, default: [], null: false
    add_column :users, :calendar_waitlist, :jsonb, default: {}, null: false
  end
end
