# frozen_string_literal: true

class AddReengagementEnabledToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    add_column :notification_preferences, :reengagement_enabled, :boolean, default: true, null: false
  end
end
