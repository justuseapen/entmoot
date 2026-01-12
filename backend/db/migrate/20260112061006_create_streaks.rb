# frozen_string_literal: true

class CreateStreaks < ActiveRecord::Migration[7.2]
  def change
    create_table :streaks do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :streak_type, null: false
      t.integer :current_count, default: 0, null: false
      t.integer :longest_count, default: 0, null: false
      t.date :last_activity_date

      t.timestamps
    end

    add_index :streaks, %i[user_id streak_type], unique: true, name: "index_streaks_unique_user_type"
  end
end
