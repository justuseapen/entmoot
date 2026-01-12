# frozen_string_literal: true

class CreateUserBadges < ActiveRecord::Migration[7.2]
  def change
    create_table :user_badges do |t|
      t.references :user, null: false, foreign_key: true
      t.references :badge, null: false, foreign_key: true
      t.datetime :earned_at, null: false

      t.timestamps
    end

    add_index :user_badges, %i[user_id badge_id], unique: true, name: "index_user_badges_unique_user_badge"
  end
end
