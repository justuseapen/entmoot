# frozen_string_literal: true

class AddTipsFieldsToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    add_column :notification_preferences, :tips_enabled, :boolean, default: true, null: false
    add_column :notification_preferences, :shown_tips, :jsonb, default: [], null: false
  end
end
