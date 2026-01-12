# frozen_string_literal: true

class CreateBadges < ActiveRecord::Migration[7.2]
  def change
    create_table :badges do |t|
      t.string :name, null: false
      t.string :description, null: false
      t.string :icon, null: false
      t.string :category, null: false
      t.jsonb :criteria, default: {}, null: false

      t.timestamps
    end

    add_index :badges, :name, unique: true
    add_index :badges, :category
  end
end
