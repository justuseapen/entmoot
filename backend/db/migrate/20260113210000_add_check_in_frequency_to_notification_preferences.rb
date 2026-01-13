# frozen_string_literal: true

class AddCheckInFrequencyToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    add_column :notification_preferences, :check_in_frequency, :string, default: "daily", null: false
    add_index :notification_preferences, :check_in_frequency
  end
end
