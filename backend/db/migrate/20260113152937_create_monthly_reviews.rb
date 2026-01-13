# frozen_string_literal: true

class CreateMonthlyReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :monthly_reviews do |t|
      t.date :month, null: false
      t.references :user, null: false, foreign_key: true
      t.references :family, null: false, foreign_key: true
      t.jsonb :highlights, default: []
      t.jsonb :challenges, default: []
      t.text :lessons_learned
      t.jsonb :next_month_focus, default: []
      t.boolean :completed, default: false, null: false

      t.timestamps
    end

    add_index :monthly_reviews, %i[user_id family_id month], unique: true, name: "index_monthly_reviews_unique_month"
  end
end
