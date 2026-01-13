# frozen_string_literal: true

class AddReviewRemindersToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    change_table :notification_preferences, bulk: true do |t|
      # Monthly review reminder (default to first of month)
      t.boolean :monthly_review, default: true, null: false
      t.integer :monthly_review_day, default: 1, null: false # 1-28

      # Quarterly review reminder
      t.boolean :quarterly_review, default: true, null: false

      # Annual review reminder
      t.boolean :annual_review, default: true, null: false
    end
  end
end
