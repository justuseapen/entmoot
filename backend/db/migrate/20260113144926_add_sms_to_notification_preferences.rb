class AddSmsToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    add_column :notification_preferences, :sms, :boolean, default: false, null: false
  end
end
