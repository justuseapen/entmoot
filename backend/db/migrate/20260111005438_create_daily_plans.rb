# frozen_string_literal: true

class CreateDailyPlans < ActiveRecord::Migration[7.2]
  def change
    create_table :daily_plans do |t|
      t.date :date, null: false
      t.references :user, null: false, foreign_key: true
      t.references :family, null: false, foreign_key: true
      t.text :intention

      t.timestamps
    end

    add_index :daily_plans, %i[user_id family_id date], unique: true
  end
end
