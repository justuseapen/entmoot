# frozen_string_literal: true

class CreateNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    create_table :notification_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }

      # Channel preferences (all boolean)
      t.boolean :in_app, default: true, null: false
      t.boolean :email, default: true, null: false
      t.boolean :push, default: false, null: false

      # Reminder preferences (all boolean)
      t.boolean :morning_planning, default: true, null: false
      t.boolean :evening_reflection, default: true, null: false
      t.boolean :weekly_review, default: true, null: false

      # Preferred times for each reminder type (stored as "HH:MM" strings)
      t.string :morning_planning_time, default: "07:00", null: false
      t.string :evening_reflection_time, default: "20:00", null: false
      t.string :weekly_review_time, default: "18:00", null: false
      t.integer :weekly_review_day, default: 0, null: false # 0 = Sunday

      # Quiet hours (stored as "HH:MM" strings)
      t.string :quiet_hours_start, default: "22:00", null: false
      t.string :quiet_hours_end, default: "07:00", null: false

      t.timestamps
    end
  end
end
