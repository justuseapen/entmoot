# frozen_string_literal: true

class AddActivityTrackingToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :last_active_at, :datetime
    add_column :users, :last_daily_plan_at, :datetime
    add_column :users, :last_reflection_at, :datetime
    add_column :users, :last_weekly_review_at, :datetime

    add_index :users, :last_active_at
    add_index :users, :last_daily_plan_at
    add_index :users, :last_reflection_at
    add_index :users, :last_weekly_review_at
  end
end
