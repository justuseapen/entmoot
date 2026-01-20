# frozen_string_literal: true

class AddTemplateFieldsToWeeklyReviews < ActiveRecord::Migration[7.2]
  def change
    change_table :weekly_reviews, bulk: true do |t|
      # Section 0: Source Review
      t.boolean :source_review_completed, default: false, null: false

      # Section 1: Review (Evidence-based)
      t.text :wins_shipped        # replaces 'wins' (jsonb)
      t.text :losses_friction     # replaces 'challenges' (jsonb)

      # Section 2: Metrics Snapshot
      t.integer :workouts_completed
      t.integer :workouts_planned
      t.integer :walks_completed
      t.integer :walks_planned, default: 7
      t.integer :writing_sessions_completed
      t.integer :writing_sessions_planned
      t.integer :house_resets_completed
      t.integer :house_resets_planned, default: 7
      t.boolean :meals_prepped_held
      t.text :metrics_notes

      # Section 3: System Health Check
      t.boolean :daily_focus_used_every_day
      t.boolean :weekly_priorities_clear
      t.boolean :cleaning_system_held
      t.boolean :training_volume_sustainable
      t.text :system_to_adjust

      # Section 4: Weekly Priorities
      t.text :weekly_priorities # replaces 'next_week_priorities' (jsonb)

      # Section 5: Kill List
      t.text :kill_list

      # Section 6: Forward Setup
      t.boolean :workouts_blocked, default: false, null: false
      t.boolean :monday_top_3_decided, default: false, null: false
      t.boolean :monday_focus_card_prepped, default: false, null: false
    end

    # Remove deprecated columns
    # Keep old columns for now for data migration purposes
    # They can be removed in a future migration after data is migrated
    # remove_column :weekly_reviews, :wins, :jsonb
    # remove_column :weekly_reviews, :challenges, :jsonb
    # remove_column :weekly_reviews, :next_week_priorities, :jsonb
    # remove_column :weekly_reviews, :lessons_learned, :text
  end
end
