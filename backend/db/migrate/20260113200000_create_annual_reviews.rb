# frozen_string_literal: true

class CreateAnnualReviews < ActiveRecord::Migration[7.2]
  def change
    create_annual_reviews_table
    add_annual_reviews_index
  end

  private

  def create_annual_reviews_table
    create_table :annual_reviews do |t|
      t.integer :year, null: false
      t.references :user, null: false, foreign_key: true
      t.references :family, null: false, foreign_key: true
      t.jsonb :year_highlights, default: []
      t.jsonb :year_challenges, default: []
      t.text :lessons_learned
      t.jsonb :gratitude, default: []
      t.string :next_year_theme
      t.jsonb :next_year_goals, default: []
      t.boolean :completed, default: false, null: false

      t.timestamps
    end
  end

  def add_annual_reviews_index
    add_index :annual_reviews, %i[user_id family_id year], unique: true, name: "index_annual_reviews_unique"
  end
end
