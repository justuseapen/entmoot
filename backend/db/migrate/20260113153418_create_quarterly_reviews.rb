# frozen_string_literal: true

class CreateQuarterlyReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :quarterly_reviews do |t|
      t.date :quarter_start_date, null: false
      t.references :user, null: false, foreign_key: true
      t.references :family, null: false, foreign_key: true
      t.jsonb :achievements, default: []
      t.jsonb :obstacles, default: []
      t.text :insights
      t.jsonb :next_quarter_objectives, default: []
      t.boolean :completed, default: false, null: false

      t.timestamps
    end

    add_index :quarterly_reviews, %i[user_id family_id quarter_start_date],
              unique: true,
              name: "index_quarterly_reviews_unique"
  end
end
