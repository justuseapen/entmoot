# frozen_string_literal: true

class AddReengagementPreferencesToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    change_table :notification_preferences, bulk: true do |t|
      t.boolean :missed_checkin_reminder, default: true, null: false
      t.boolean :inactivity_reminder, default: true, null: false
      t.integer :inactivity_threshold_days, default: 7, null: false
    end
  end
end
