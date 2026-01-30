# frozen_string_literal: true

class DropRemovedFeatureTables < ActiveRecord::Migration[7.2]
  def up
    # Remove foreign keys first
    remove_foreign_key :goal_assignments, :goals, if_exists: true
    remove_foreign_key :goal_assignments, :users, if_exists: true
    remove_foreign_key :goals, :families, if_exists: true
    remove_foreign_key :goals, :goals, column: :parent_id, if_exists: true
    remove_foreign_key :goals, :users, column: :creator_id, if_exists: true
    remove_foreign_key :reflection_responses, :reflections, if_exists: true
    remove_foreign_key :reflections, :daily_plans, if_exists: true
    remove_foreign_key :reflections, :families, if_exists: true
    remove_foreign_key :reflections, :users, if_exists: true
    remove_foreign_key :weekly_reviews, :families, if_exists: true
    remove_foreign_key :weekly_reviews, :users, if_exists: true
    remove_foreign_key :monthly_reviews, :families, if_exists: true
    remove_foreign_key :monthly_reviews, :users, if_exists: true
    remove_foreign_key :quarterly_reviews, :families, if_exists: true
    remove_foreign_key :quarterly_reviews, :users, if_exists: true
    remove_foreign_key :annual_reviews, :families, if_exists: true
    remove_foreign_key :annual_reviews, :users, if_exists: true
    remove_foreign_key :user_badges, :badges, if_exists: true
    remove_foreign_key :user_badges, :users, if_exists: true
    remove_foreign_key :streaks, :users, if_exists: true
    remove_foreign_key :points_ledger_entries, :users, if_exists: true
    remove_foreign_key :calendar_sync_mappings, :users, if_exists: true
    remove_foreign_key :google_calendar_credentials, :users, if_exists: true
    remove_foreign_key :mentions, :users, if_exists: true
    remove_foreign_key :mentions, :users, column: :mentioned_user_id, if_exists: true
    remove_foreign_key :outreach_histories, :users, if_exists: true

    # Drop tables
    drop_table :goal_assignments, if_exists: true
    drop_table :goals, if_exists: true
    drop_table :reflection_responses, if_exists: true
    drop_table :reflections, if_exists: true
    drop_table :weekly_reviews, if_exists: true
    drop_table :monthly_reviews, if_exists: true
    drop_table :quarterly_reviews, if_exists: true
    drop_table :annual_reviews, if_exists: true
    drop_table :user_badges, if_exists: true
    drop_table :badges, if_exists: true
    drop_table :streaks, if_exists: true
    drop_table :points_ledger_entries, if_exists: true
    drop_table :calendar_sync_mappings, if_exists: true
    drop_table :google_calendar_credentials, if_exists: true
    drop_table :mentions, if_exists: true
    drop_table :outreach_histories, if_exists: true
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
