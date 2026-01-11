# frozen_string_literal: true

class CreateWeeklyReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :weekly_reviews do |t|
      t.date :week_start_date, null: false
      t.references :user, null: false, foreign_key: true
      t.references :family, null: false, foreign_key: true
      t.jsonb :wins, default: []
      t.jsonb :challenges, default: []
      t.jsonb :next_week_priorities, default: []
      t.text :lessons_learned
      t.boolean :completed, default: false, null: false

      t.timestamps
    end

    add_index :weekly_reviews, %i[user_id family_id week_start_date], unique: true, name: "index_weekly_reviews_unique_week"
  end
end
